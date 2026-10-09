/* eslint-disable @typescript-eslint/no-explicit-any */
// In-browser mock of everything the app talks to: Supabase REST (PostgREST), RPCs, Auth,
// Edge Functions, Cloudinary and EmailJS. It keeps state in memory per test, emulates the
// important database rules (drafts hidden from readers, admin-only writes, one view per
// visitor), and records every call so tests can assert what the app sent.
import type { BrowserContext, Request, Route } from "@playwright/test";
import { RECRUITMENTS, TEST_USERS, day, istToday, seedCatalog, seedCollectionItems, seedCollections, seedPosts, seedQuiz, type Post } from "./data";

export const MOCK_HOST = "e2e-mock.supabase.co";
export const STORAGE_KEY = "sb-e2e-mock-auth-token";
const ALLOWED_EXTERNAL = ["api.cloudinary.com", "api.emailjs.com"];
// Content images the pages legitimately use; answered with a 1×1 PNG so tests stay offline.
const IMAGE_HOSTS = ["res.cloudinary.com", "images.unsplash.com"];
const PIXEL = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

type Row = Record<string, any>;
type User = (typeof TEST_USERS)[keyof typeof TEST_USERS];

export interface LoggedCall {
  method: string;
  path: string;
  query: URLSearchParams;
  body: any;
  user: string | null;
}

const b64url = (s: string) => Buffer.from(s).toString("base64url");

export function fakeJwt(user: User): string {
  const exp = Math.floor(Date.now() / 1000) + 24 * 3600;
  return `${b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64url(JSON.stringify({ sub: user.id, email: user.email, role: "authenticated", aud: "authenticated", exp }))}.e2e-signature`;
}

function authUser(user: User) {
  return {
    id: user.id,
    aud: "authenticated",
    role: "authenticated",
    email: user.email,
    email_confirmed_at: "2026-01-01T00:00:00Z",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { full_name: user.name },
    identities: [{ id: user.id, provider: "email" }],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

export function sessionFor(user: User) {
  const expiresIn = 24 * 3600;
  return {
    access_token: fakeJwt(user),
    token_type: "bearer",
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    refresh_token: `refresh-${user.id}`,
    user: authUser(user),
  };
}

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${istToday()}T00:00:00Z`)) / 86_400_000);
}

function jobStatus(p: Post): string | null {
  const left = daysUntil(p.job?.last_date ?? null);
  if (left === null) return null;
  if (left < 0) return "closed";
  if (p.job?.apply_start && (daysUntil(p.job.apply_start) ?? 0) > 0) return "upcoming";
  if (left <= 7) return "closing";
  return "open";
}

/** PostgREST filter subset: eq, neq, in, is, like, ilike, gte, lte, cs, ov. */
function applyFilters(rows: Row[], query: URLSearchParams): Row[] {
  const reserved = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]);
  let out = rows;
  for (const [key, raw] of query.entries()) {
    if (reserved.has(key)) continue;
    const dot = raw.indexOf(".");
    const op = raw.slice(0, dot);
    const value = raw.slice(dot + 1);
    out = out.filter((r) => {
      const v = r[key];
      switch (op) {
        case "eq":
          return String(v) === value;
        case "neq":
          return String(v) !== value;
        case "is":
          return value === "null" ? v === null || v === undefined : String(v) === value;
        case "in":
          return value.replace(/^\(|\)$/g, "").split(",").map((s) => s.replace(/^"|"$/g, "")).includes(String(v));
        case "like":
        case "ilike": {
          const pattern = new RegExp(`^${value.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/\*/g, ".*")}$`, op === "ilike" ? "i" : "");
          return pattern.test(String(v ?? ""));
        }
        case "gte":
          return String(v) >= value;
        case "lte":
          return String(v) <= value;
        default:
          return true;
      }
    });
  }
  const order = query.get("order");
  if (order) {
    const [col, dir] = order.split(",")[0].split(".");
    out = [...out].sort((a, b) => (String(a[col] ?? "") < String(b[col] ?? "") ? -1 : 1) * (dir === "desc" ? -1 : 1));
  }
  const offset = Number(query.get("offset") ?? 0);
  const limit = query.get("limit") ? Number(query.get("limit")) : undefined;
  return out.slice(offset, limit !== undefined ? offset + limit : undefined);
}

export class MockBackend {
  posts: Post[] = seedPosts();
  quiz = seedQuiz();
  catalog: Row[] = seedCatalog();
  collections: Row[] = seedCollections();
  collectionItems: Row[] = seedCollectionItems();
  /** Paths uploaded to / removed from storage buckets. */
  storage = { uploaded: [] as string[], removed: [] as string[] };
  recruitments = [...RECRUITMENTS];
  users: User[] = [TEST_USERS.reader, TEST_USERS.admin];
  tables: Record<string, Row[]> = {
    comments: [],
    comment_reports: [],
    post_likes: [],
    post_bookmarks: [],
    job_reminders: [],
    recruitment_follows: [],
    user_notifications: [],
    user_preferences: [],
    quiz_attempts: [],
    newsletter: [],
    post_views: [],
    post_shares: [],
  };
  calls: LoggedCall[] = [];
  external: string[] = [];
  emails: any[] = [];
  /** Force a status for matching paths, e.g. { "rpc/list_posts": 500 } to simulate outages. */
  failures: Record<string, number> = {};

  find(predicate: (c: LoggedCall) => boolean) {
    return this.calls.filter(predicate);
  }

  rpcCalls(name: string) {
    return this.find((c) => c.path === `/rest/v1/rpc/${name}`);
  }

  writes(table: string, method?: string) {
    return this.find((c) => c.path === `/rest/v1/${table}` && c.method !== "GET" && c.method !== "HEAD" && (!method || c.method === method));
  }

  async install(context: BrowserContext) {
    await context.route("**/*", (route) => this.handle(route));
  }

  private userFrom(req: Request): User | null {
    const token = (req.headers()["authorization"] ?? "").replace(/^Bearer /, "");
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    try {
      const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      return this.users.find((u) => u.id === claims.sub) ?? null;
    } catch {
      return null;
    }
  }

  private async handle(route: Route) {
    const req = route.request();
    const url = new URL(req.url());
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return route.continue();
    if (url.hostname === MOCK_HOST) return this.supabase(route, req, url);
    if (url.hostname === "api.cloudinary.com") {
      this.calls.push({ method: req.method(), path: url.pathname, query: url.searchParams, body: null, user: null });
      return json(route, 200, { secure_url: "https://res.cloudinary.com/e2e/image/upload/v1/malani-blog/cover.webp" });
    }
    if (IMAGE_HOSTS.includes(url.hostname) && req.resourceType() === "image") {
      return route.fulfill({ status: 200, contentType: "image/png", body: PIXEL });
    }
    if (url.hostname === "api.emailjs.com") {
      this.emails.push(safeJson(req.postData()));
      return route.fulfill({ status: 200, body: "OK" });
    }
    if (!ALLOWED_EXTERNAL.includes(url.hostname)) this.external.push(url.href);
    return route.abort("blockedbyclient");
  }

  private async supabase(route: Route, req: Request, url: URL) {
    const method = req.method();
    const path = url.pathname;
    const body = safeJson(req.postData());
    const user = this.userFrom(req);
    this.calls.push({ method, path, query: url.searchParams, body, user: user?.id ?? null });

    const forced = Object.entries(this.failures).find(([p]) => path.includes(p));
    if (forced) return json(route, forced[1], { message: "simulated outage", code: "PGRST000" });

    if (method === "OPTIONS") return route.fulfill({ status: 204, headers: cors() });
    if (path.startsWith("/auth/v1/")) return this.auth(route, path, url, body, user);
    if (path.startsWith("/functions/v1/")) return this.functions(route, path.split("/").pop()!, body, user);
    if (path.startsWith("/storage/v1/")) return this.storageApi(route, method, path.slice("/storage/v1/".length), body, user);
    if (path.startsWith("/rest/v1/rpc/")) return this.rpc(route, path.split("/").pop()!, body, user);
    if (path.startsWith("/rest/v1/")) return this.rest(route, req, path.slice("/rest/v1/".length), url.searchParams, body, user);
    return json(route, 404, { message: "unknown endpoint" });
  }

  // --- Auth ------------------------------------------------------------------
  private auth(route: Route, path: string, url: URL, body: any, user: User | null) {
    const endpoint = path.slice("/auth/v1/".length);
    if (endpoint === "token") {
      const grant = url.searchParams.get("grant_type");
      if (grant === "password") {
        const match = this.users.find((u) => u.email === body?.email && u.password === body?.password);
        if (!match) return json(route, 400, { code: "invalid_credentials", error: "invalid_grant", error_description: "Invalid login credentials", message: "Invalid login credentials" });
        return json(route, 200, sessionFor(match));
      }
      if (grant === "refresh_token") {
        const match = this.users.find((u) => `refresh-${u.id}` === body?.refresh_token);
        return match ? json(route, 200, sessionFor(match)) : json(route, 400, { error: "invalid_grant", message: "Invalid Refresh Token" });
      }
    }
    if (endpoint === "signup") {
      if (this.users.some((u) => u.email === body?.email)) return json(route, 422, { code: "user_already_exists", message: "User already registered" });
      return json(route, 200, { id: "e2e00000-0000-4000-8000-0000000000ff", aud: "authenticated", role: "authenticated", email: body?.email, identities: [{ id: "x" }], created_at: new Date().toISOString(), user_metadata: body?.data ?? {} });
    }
    if (endpoint === "recover") return json(route, 200, {});
    if (endpoint === "logout") return route.fulfill({ status: 204, headers: cors() });
    if (endpoint === "user") {
      if (!user) return json(route, 401, { message: "JWT expired" });
      if (route.request().method() === "PUT") return json(route, 200, authUser(user));
      return json(route, 200, authUser(user));
    }
    if (endpoint === "authorize") return route.fulfill({ status: 200, contentType: "text/html", body: "<h1>Google sign-in (mock)</h1>" });
    return json(route, 404, { message: `auth ${endpoint} not mocked` });
  }

  // --- Storage (catalog bucket) ------------------------------------------------
  private storageApi(route: Route, method: string, rest: string, body: any, user: User | null) {
    if (method === "GET" && rest.startsWith("object/public/")) return route.fulfill({ status: 200, contentType: "image/png", body: PIXEL, headers: cors() });
    if (user?.role !== "admin") return json(route, 403, { statusCode: "403", error: "Unauthorized", message: "new row violates row-level security policy" });
    if (method === "POST" && rest.startsWith("object/")) {
      const key = rest.slice("object/".length);
      this.storage.uploaded.push(key);
      return json(route, 200, { Key: key, Id: "e2e-object" });
    }
    if (method === "DELETE" && rest.startsWith("object/")) {
      const bucket = rest.slice("object/".length);
      const prefixes: string[] = body?.prefixes ?? [];
      this.storage.removed.push(...prefixes.map((p) => `${bucket}/${p}`));
      return json(route, 200, prefixes.map((name) => ({ name })));
    }
    return json(route, 404, { message: `storage ${rest} not mocked` });
  }

  // --- Edge functions ---------------------------------------------------------
  private functions(route: Route, name: string, body: any, user: User | null) {
    if (name === "newsletter") return json(route, 200, { status: "pending" });
    if (name === "cloudinary-sign") {
      if (user?.role !== "admin") return json(route, 403, { error: "Admins only" });
      return json(route, 200, { cloudName: "e2e", apiKey: "k", timestamp: 1, folder: "malani-blog", signature: "sig" });
    }
    if (name === "generate-blog") {
      if (user?.role !== "admin") return json(route, 403, { error: "Admins only" });
      return json(route, 200, {
        title: "RPSC प्राध्यापक भर्ती 2026 — 500 पद",
        metaDescription: "RPSC ने प्राध्यापक के 500 पदों पर भर्ती निकाली है।",
        content: "<h2>भर्ती का विवरण</h2><p>RPSC ने 500 पदों पर भर्ती निकाली है।</p>",
        postType: "job",
        tags: ["RPSC", "प्राध्यापक"],
        job: {
          organisation: "RPSC", totalPosts: 500, qualifications: ["postgraduate"], departments: ["rpsc"], state: "rajasthan",
          ageMin: 21, ageMax: 40, applyStart: day(1), lastDate: day(30), feeLastDate: null, examDate: null, admitCardDate: null,
          resultDate: null, salary: "पे-लेवल 12", fees: [{ category: "सामान्य", amount: 600 }], applyLink: "https://rpsc.rajasthan.gov.in/apply",
          notificationPdf: null, officialWebsite: "https://rpsc.rajasthan.gov.in",
        },
      });
    }
    if (name === "delete-account") return json(route, 200, user?.role === "admin" ? { error: "एडमिन खाता यहाँ से नहीं हटाया जा सकता।" } : { status: "deleted" });
    return json(route, 404, { error: "unknown function" });
  }

  // --- RPCs ----------------------------------------------------------------------
  private rpc(route: Route, name: string, body: any, user: User | null) {
    switch (name) {
      case "list_posts":
        return json(route, 200, this.listPosts(body ?? {}, user));
      case "record_post_view": {
        const exists = this.tables.post_views.some((v) => v.post_id === body.p_post_id && v.visitor_id === body.p_visitor_id);
        if (!exists) {
          this.tables.post_views.push({ post_id: body.p_post_id, visitor_id: body.p_visitor_id });
          const p = this.posts.find((x) => x.id === body.p_post_id);
          if (p) p.views_count += 1;
        }
        return route.fulfill({ status: 204, headers: cors() });
      }
      case "record_post_share":
        this.tables.post_shares.push(body);
        return route.fulfill({ status: 204, headers: cors() });
      case "submit_quiz": {
        const qs = this.quiz.filter((q) => q.quiz_date === body.p_quiz_date).sort((a, b) => a.position - b.position);
        const results = qs.map((q, i) => ({ id: q.id, correct_index: q.correct_index, chosen: body.p_answers[i] ?? null, is_correct: body.p_answers[i] === q.correct_index, explanation: q.explanation }));
        this.tables.quiz_attempts.push({ quiz_date: body.p_quiz_date, visitor_id: body.p_visitor_id });
        return json(route, 200, { score: results.filter((r) => r.is_correct).length, total: qs.length, results });
      }
      case "admin_blog_analytics":
        if (user?.role !== "admin") return json(route, 400, { message: "Admins only", code: "42501" });
        return json(route, 200, {
          totals: { posts: this.posts.length, published: this.posts.filter((p) => p.status === "published").length, drafts: 1, scheduled: 0, views: 4321, likes: 12, comments: 3, shares: 9, bookmarks: 4 },
          subscribers: 7, pending_subscribers: 2, users: 2, push_subscribers: 0, reported_comments: 0,
          categories: [{ category: "Government Job", count: 25, views: 4000, likes: 10 }],
          trending: this.posts.slice(0, 3).map((p) => ({ id: p.id, title: p.title, slug: p.slug, views_count: p.views_count, likes_count: 0, comments_count: 0, share_count: 0 })),
          views_last_14_days: Array.from({ length: 14 }, (_, i) => ({ date: day(i - 13), views: 100 + i * 10 })),
        });
      case "admin_todo":
        if (user?.role !== "admin") return json(route, 400, { message: "Admins only" });
        return json(route, 200, {
          drafts: this.posts.filter((p) => p.status === "draft").map((p) => ({ id: p.id, title: p.title, updated_at: p.updated_at })),
          draft_count: this.posts.filter((p) => p.status === "draft").length,
          short_posts: [],
          short_count: 0,
          closing_jobs: [],
          unanswered: [],
          quiz_today: this.quiz.some((q) => q.quiz_date === istToday()),
          products_without_price: this.catalog.filter((i) => i.kind === "product" && i.is_active && i.price === null).length,
        });
      case "admin_quiz_questions":
        if (user?.role !== "admin") return json(route, 400, { message: "Admins only" });
        return json(route, 200, this.quiz.filter((q) => q.quiz_date === body.p_quiz_date));
      case "moderate_comment":
      case "mark_notifications_read":
      case "set_push_reminder":
      case "upsert_push_subscription":
        return route.fulfill({ status: 204, headers: cors() });
      default:
        return json(route, 404, { message: `rpc ${name} not mocked` });
    }
  }

  listPosts(p: any, user: User | null) {
    const now = Date.now();
    let rows = this.posts.filter((x) => x.status === "published" && x.published_at && Date.parse(x.published_at) <= now);
    if (p.p_post_types) rows = rows.filter((x) => p.p_post_types.includes(x.post_type));
    if (p.p_search) {
      const q = String(p.p_search).toLowerCase();
      rows = rows.filter((x) => `${x.title} ${x.excerpt} ${x.job?.organisation ?? ""}`.toLowerCase().includes(q));
    }
    if (p.p_qualification) rows = rows.filter((x) => x.job?.qualifications.includes(p.p_qualification) || x.job?.qualifications.includes("any"));
    if (p.p_department) rows = rows.filter((x) => x.job?.departments.includes(p.p_department));
    if (p.p_state) rows = rows.filter((x) => x.job?.state === p.p_state);
    if (p.p_job_status) rows = rows.filter((x) => (p.p_job_status === "active" ? ["open", "closing"].includes(jobStatus(x) ?? "") : jobStatus(x) === p.p_job_status));
    if (p.p_since) rows = rows.filter((x) => (x.published_at ?? "") >= `${p.p_since}T00:00:00+05:30` || Date.parse(x.published_at!) >= Date.parse(`${p.p_since}T00:00:00+05:30`));
    if (p.p_exclude_id) rows = rows.filter((x) => x.id !== p.p_exclude_id);
    if (p.p_ids) rows = rows.filter((x) => p.p_ids.includes(x.id));
    const sort = p.p_sort ?? "latest";
    rows = [...rows].sort((a, b) => {
      if (sort === "deadline") return (a.job?.last_date ?? "9999") < (b.job?.last_date ?? "9999") ? -1 : 1;
      if (sort === "posts") return (b.job?.total_posts ?? 0) - (a.job?.total_posts ?? 0);
      if (sort === "trending") return b.views_count - a.views_count;
      return Date.parse(b.published_at!) - Date.parse(a.published_at!);
    });
    const total = rows.length;
    const limit = Math.min(Number(p.p_limit ?? 20), 50);
    const offset = Number(p.p_offset ?? 0);
    void user;
    return rows.slice(offset, offset + limit).map((x) => ({
      id: x.id, title: x.title, slug: x.slug, excerpt: x.excerpt, image_url: x.image_url, category: x.category, tags: x.tags,
      post_type: x.post_type, published_at: x.published_at, updated_at: x.updated_at, is_verified: x.is_verified,
      read_time_min: x.read_time_min, views_count: x.views_count, likes_count: x.likes_count, comments_count: x.comments_count,
      share_count: x.share_count, organisation: x.job?.organisation ?? null, total_posts: x.job?.total_posts ?? null,
      qualifications: x.job?.qualifications ?? null, departments: x.job?.departments ?? null, state: x.job?.state ?? null,
      apply_start: x.job?.apply_start ?? null, last_date: x.job?.last_date ?? null, exam_date: x.job?.exam_date ?? null,
      recruitment_id: x.job?.recruitment_id ?? null, job_status: jobStatus(x), days_left: daysUntil(x.job?.last_date ?? null), total_count: total,
    }));
  }

  // --- REST tables -----------------------------------------------------------------
  private rest(route: Route, req: Request, table: string, query: URLSearchParams, body: any, user: User | null) {
    const method = req.method();
    const headers = req.headers();
    const wantsObject = (headers["accept"] ?? "").includes("vnd.pgrst.object");
    const prefer = headers["prefer"] ?? "";
    const respond = (rows: Row[], status = 200) => {
      if (method === "HEAD" || prefer.includes("count=exact")) {
        const h = { ...cors(), "content-range": `0-${Math.max(0, rows.length - 1)}/${rows.length}`, "content-type": "application/json" };
        if (method === "HEAD") return route.fulfill({ status: 200, headers: h, body: "" });
        return route.fulfill({ status, headers: h, body: JSON.stringify(rows) });
      }
      if (wantsObject) {
        if (rows.length !== 1) return json(route, 406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" });
        return json(route, status, rows[0]);
      }
      return json(route, status, rows);
    };
    const isAdmin = user?.role === "admin";

    if (table === "posts") return this.postsTable(route, method, query, body, user, respond, prefer);
    if (table === "job_details") {
      if (method === "GET") {
        const ids = (query.get("recruitment_id") ?? "").replace(/^in\.\(|\)$/g, "").split(",");
        const rows = this.posts
          .filter((p) => p.job && ids.includes(p.job.recruitment_id ?? ""))
          .map((p) => ({ ...p.job!, posts: { id: p.id, title: p.title, slug: p.slug, post_type: p.post_type, published_at: p.published_at, status: p.status } }));
        return respond(rows);
      }
      if (!isAdmin) return json(route, 403, { code: "42501", message: "new row violates row-level security policy" });
      if (method === "POST") {
        const row = Array.isArray(body) ? body[0] : body;
        const p = this.posts.find((x) => x.id === row.post_id);
        if (p) p.job = { ...(p.job ?? ({} as any)), ...row };
        return route.fulfill({ status: 201, headers: cors() });
      }
      if (method === "DELETE") return route.fulfill({ status: 204, headers: cors() });
    }
    if (table === "profiles") {
      const rows = this.users.map((u) => ({ id: u.id, full_name: u.name, avatar_url: null }));
      if (method === "PATCH") return route.fulfill({ status: 204, headers: cors() });
      return respond(applyFilters(rows, query));
    }
    if (table === "user_roles") return respond(user ? [{ role: user.role, user_id: user.id }] : []);
    if (table === "recruitments") {
      if (method === "POST") {
        if (!isAdmin) return json(route, 403, { code: "42501", message: "rls" });
        const row = { id: `e2e20000-0000-4000-8000-${String(this.recruitments.length + 1).padStart(12, "0")}`, created_at: new Date().toISOString(), ...(Array.isArray(body) ? body[0] : body) };
        this.recruitments.push(row);
        return respond([row], 201);
      }
      return respond(applyFilters(this.recruitments, query));
    }
    if (table === "catalog_items") {
      if (method === "GET") return respond(applyFilters(this.catalog.filter((r) => isAdmin || r.is_active), query));
      if (!isAdmin) return json(route, 403, { code: "42501", message: "new row violates row-level security policy" });
      if (method === "POST") {
        const row = Array.isArray(body) ? body[0] : body;
        const created = { id: `e2e49999-0000-4000-8000-${String(this.catalog.length + 1).padStart(12, "0")}`, created_at: new Date().toISOString(), mrp: null, ...row };
        this.catalog.push(created);
        return respond([created], 201);
      }
      if (method === "PATCH") {
        applyFilters(this.catalog, query).forEach((r) => Object.assign(r, body));
        return route.fulfill({ status: 204, headers: cors() });
      }
      if (method === "DELETE") {
        const doomed = new Set(applyFilters(this.catalog, query));
        this.catalog = this.catalog.filter((r) => !doomed.has(r));
        return route.fulfill({ status: 204, headers: cors() });
      }
    }
    if (table === "catalog_collections") {
      if (method === "GET") return respond(applyFilters(this.collections.filter((c) => isAdmin || c.is_active), query));
      if (!isAdmin) return json(route, 403, { code: "42501", message: "rls" });
      if (method === "POST") {
        const created = { id: `e2e48000-0000-4000-8000-${String(this.collections.length + 1).padStart(12, "0")}`, created_at: new Date().toISOString(), description: null, sort_order: 0, is_active: true, ...(Array.isArray(body) ? body[0] : body) };
        this.collections.push(created);
        return respond([created], 201);
      }
      if (method === "PATCH") {
        applyFilters(this.collections, query).forEach((r) => Object.assign(r, body));
        return route.fulfill({ status: 204, headers: cors() });
      }
      if (method === "DELETE") {
        const doomed = new Set(applyFilters(this.collections, query).map((c) => c.id));
        this.collections = this.collections.filter((c) => !doomed.has(c.id));
        this.collectionItems = this.collectionItems.filter((l) => !doomed.has(l.collection_id));
        return route.fulfill({ status: 204, headers: cors() });
      }
    }
    if (table === "catalog_collection_items") {
      if (method === "GET") {
        const visible = this.collectionItems.filter(
          (l) => isAdmin || (this.collections.some((c) => c.id === l.collection_id && c.is_active) && this.catalog.some((i) => i.id === l.item_id && i.is_active)),
        );
        return respond(applyFilters(visible, query));
      }
      if (!isAdmin) return json(route, 403, { code: "42501", message: "rls" });
      if (method === "POST") {
        (Array.isArray(body) ? body : [body]).forEach((r: Row) => this.collectionItems.push({ sort_order: 0, ...r }));
        return route.fulfill({ status: 201, headers: cors() });
      }
      if (method === "DELETE") {
        const doomed = new Set(applyFilters(this.collectionItems, query));
        this.collectionItems = this.collectionItems.filter((l) => !doomed.has(l));
        return route.fulfill({ status: 204, headers: cors() });
      }
    }
    if (table === "quiz_questions") {
      if (method === "GET") return respond(applyFilters(this.quiz.map(({ correct_index: _c, ...q }) => q), query));
      if (!isAdmin) return json(route, 403, { code: "42501", message: "rls" });
      if (method === "DELETE") {
        const date = (query.get("quiz_date") ?? "").replace(/^eq\./, "");
        this.quiz = this.quiz.filter((q) => q.quiz_date !== date);
        return route.fulfill({ status: 204, headers: cors() });
      }
      if (method === "POST") {
        (Array.isArray(body) ? body : [body]).forEach((q: any, i: number) => this.quiz.push({ id: `new-q-${i}-${Date.now()}`, ...q }));
        return route.fulfill({ status: 201, headers: cors() });
      }
    }

    // Generic per-user tables.
    const store = this.tables[table];
    if (!store) return json(route, 404, { message: `table ${table} not mocked` });
    if (method === "GET" || method === "HEAD") {
      let rows = applyFilters(store, query);
      if (table === "recruitment_follows") rows = rows.map((r) => ({ ...r, recruitments: this.recruitments.find((x) => x.id === r.recruitment_id) ?? null }));
      if (table === "user_notifications") rows = rows.map((r) => ({ ...r, posts: this.posts.find((p) => p.id === r.post_id) ?? null }));
      if (table === "comments") rows = rows.map((r) => ({ ...r, posts: this.posts.find((p) => p.id === r.post_id) ?? null }));
      return respond(rows);
    }
    if (!user && table !== "newsletter") return json(route, 401, { code: "42501", message: "new row violates row-level security policy" });
    if (method === "POST") {
      const rows = (Array.isArray(body) ? body : [body]).map((r: any) => ({ id: `row-${store.length + 1}-${Math.random().toString(36).slice(2, 8)}`, created_at: new Date().toISOString(), is_pinned: false, is_hidden: false, ...r }));
      for (const r of rows) {
        const dup = store.find((x) => (table === "post_likes" || table === "post_bookmarks") && x.post_id === r.post_id && x.user_id === r.user_id);
        if (dup && !prefer.includes("resolution")) return json(route, 409, { code: "23505", message: "duplicate key value violates unique constraint" });
        if (!dup) store.push(r);
      }
      return prefer.includes("return=representation") ? respond(rows, 201) : route.fulfill({ status: 201, headers: cors() });
    }
    if (method === "PATCH") {
      applyFilters(store, query).forEach((r) => Object.assign(r, body));
      return route.fulfill({ status: 204, headers: cors() });
    }
    if (method === "DELETE") {
      const doomed = new Set(applyFilters(store, query));
      this.tables[table] = store.filter((r) => !doomed.has(r));
      return route.fulfill({ status: 204, headers: cors() });
    }
    return json(route, 405, { message: "method not mocked" });
  }

  private postsTable(route: Route, method: string, query: URLSearchParams, body: any, user: User | null, respond: (rows: Row[], status?: number) => any, prefer: string) {
    const isAdmin = user?.role === "admin";
    const visible = this.posts.filter((p) => isAdmin || (p.status === "published" && p.published_at && Date.parse(p.published_at) <= Date.now()));
    const toRow = (p: Post) => {
      const { job, ...rest } = p;
      return query.get("select")?.includes("job_details") ? { ...rest, job_details: job ? [job] : [] } : rest;
    };
    if (method === "GET" || method === "HEAD") return respond(applyFilters(visible.map(toRow), query));
    if (!isAdmin) return json(route, 403, { code: "42501", message: "new row violates row-level security policy for table \"posts\"" });
    if (method === "POST") {
      const input = Array.isArray(body) ? body[0] : body;
      const id = `e2e19999-0000-4000-8000-${String(this.posts.length + 1).padStart(12, "0")}`;
      const now = new Date().toISOString();
      const created: Post = {
        ...(seedPosts()[0] as Post),
        ...input,
        id,
        job: null,
        created_at: now,
        updated_at: now,
        published_at: input.status === "published" ? now : null,
        views_count: 0,
        likes_count: 0,
      };
      this.posts.unshift(created);
      return prefer.includes("return=representation") ? respond([{ id }], 201) : route.fulfill({ status: 201, headers: cors() });
    }
    if (method === "PATCH") {
      const id = (query.get("id") ?? "").replace(/^eq\./, "");
      const p = this.posts.find((x) => x.id === id);
      if (p) {
        Object.assign(p, body);
        if (body.status === "published" && !p.published_at) p.published_at = new Date().toISOString();
      }
      return route.fulfill({ status: 204, headers: cors() });
    }
    if (method === "DELETE") {
      const id = (query.get("id") ?? "").replace(/^eq\./, "");
      this.posts = this.posts.filter((p) => p.id !== id);
      return route.fulfill({ status: 204, headers: cors() });
    }
    return json(route, 405, {});
  }
}

function cors() {
  return { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-expose-headers": "content-range" };
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({ status, headers: { ...cors(), "content-type": "application/json" }, body: JSON.stringify(body) });
}

function safeJson(text: string | null): any {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
