import { describe, expect, it, vi } from "vitest";
import { opArgs, sb } from "@/test/supabaseMock";

vi.mock("@/lib/supabase", async () => ({ supabase: (await import("@/test/supabaseMock")).sb.supabase }));

const posts = await import("@/services/posts");

const POST_ID = "11111111-1111-4111-8111-111111111111";

describe("listPosts", () => {
  it("sends defaults and strips total_count from rows", async () => {
    sb.on({ kind: "rpc", name: "list_posts" }, { data: [{ id: "a", title: "A", total_count: 42 }, { id: "b", title: "B", total_count: 42 }] });
    const page = await posts.listPosts();
    expect(page.total).toBe(42);
    expect(page.items).toEqual([{ id: "a", title: "A" }, { id: "b", title: "B" }]);
    expect(sb.supabase.rpc).toHaveBeenCalledWith("list_posts", expect.objectContaining({ p_sort: "latest", p_limit: 20, p_offset: 0, p_search: undefined }));
  });

  it("maps every filter to the RPC parameters and trims search", async () => {
    await posts.listPosts({
      postTypes: ["job"],
      search: "  पटवारी  ",
      qualification: "graduate",
      department: "police",
      state: "rajasthan",
      jobStatus: "closing",
      since: "2026-10-01",
      excludeId: POST_ID,
      sort: "deadline",
      limit: 5,
      offset: 10,
    });
    expect(sb.supabase.rpc).toHaveBeenCalledWith("list_posts", {
      p_post_types: ["job"],
      p_category: undefined,
      p_tag: undefined,
      p_search: "पटवारी",
      p_qualification: "graduate",
      p_department: "police",
      p_state: "rajasthan",
      p_job_status: "closing",
      p_since: "2026-10-01",
      p_exclude_id: POST_ID,
      p_ids: undefined,
      p_sort: "deadline",
      p_limit: 5,
      p_offset: 10,
    });
  });

  it("short-circuits an empty id list without a network call", async () => {
    expect(await posts.listPosts({ ids: [] })).toEqual({ items: [], total: 0 });
    expect(sb.supabase.rpc).not.toHaveBeenCalled();
  });

  it("returns total 0 for no rows and throws database errors", async () => {
    sb.on({ name: "list_posts" }, { data: [] });
    expect(await posts.listPosts()).toEqual({ items: [], total: 0 });
    sb.on({ name: "list_posts" }, { error: { message: "boom" } });
    await expect(posts.listPosts()).rejects.toEqual({ message: "boom" });
  });
});

describe("getPost", () => {
  it("looks up by slug, normalises job_details and attaches the author", async () => {
    sb.on({ name: "posts" }, { data: { id: POST_ID, slug: "rpsc", author_id: "author-1", job_details: [{ post_id: POST_ID, organisation: "RPSC" }] } });
    sb.on({ name: "profiles" }, { data: { id: "author-1", full_name: "टीम", avatar_url: null } });
    const post = await posts.getPost("rpsc");
    expect(opArgs(sb.find("posts")[0], "eq")).toEqual(["slug", "rpsc"]);
    expect(post?.job).toEqual({ post_id: POST_ID, organisation: "RPSC" });
    expect(post?.author?.full_name).toBe("टीम");
    expect(post).not.toHaveProperty("job_details");
  });

  it("looks up by id for UUIDs (admin preview) and handles a missing job/author", async () => {
    sb.on({ name: "posts" }, { data: { id: POST_ID, slug: "x", author_id: "a", job_details: null } });
    const post = await posts.getPost(POST_ID);
    expect(opArgs(sb.find("posts")[0], "eq")).toEqual(["id", POST_ID]);
    expect(post?.job).toBeNull();
    expect(post?.author).toBeNull();
  });

  it("returns null when not found and throws on errors", async () => {
    expect(await posts.getPost("missing")).toBeNull();
    sb.on({ name: "posts" }, { error: { message: "denied" } });
    await expect(posts.getPost("x")).rejects.toEqual({ message: "denied" });
  });
});

describe("getRelatedPosts", () => {
  it("uses the department first, then fills with latest posts without duplicates", async () => {
    let n = 0;
    sb.on({ name: "list_posts" }, () => {
      n += 1;
      return n === 1
        ? { data: [{ id: "r1", total_count: 1 }] }
        : { data: [{ id: "r1", total_count: 3 }, { id: "r2", total_count: 3 }, { id: "r3", total_count: 3 }] };
    });
    const related = await posts.getRelatedPosts({ id: POST_ID, post_type: "job", category: null, job: { departments: ["police"] } as never }, 2);
    expect(related.map((r) => r.id)).toEqual(["r1", "r2"]);
    expect(sb.supabase.rpc).toHaveBeenNthCalledWith(1, "list_posts", expect.objectContaining({ p_department: "police", p_post_types: undefined, p_exclude_id: POST_ID }));
  });

  it("falls back to the post type when there is no department", async () => {
    sb.on({ name: "list_posts" }, { data: [{ id: "x", total_count: 4 }, { id: "y", total_count: 4 }, { id: "z", total_count: 4 }, { id: "w", total_count: 4 }] });
    const related = await posts.getRelatedPosts({ id: POST_ID, post_type: "result", category: null, job: null });
    expect(related).toHaveLength(4);
    expect(sb.supabase.rpc).toHaveBeenCalledTimes(1);
    expect(sb.supabase.rpc).toHaveBeenCalledWith("list_posts", expect.objectContaining({ p_post_types: ["result"] }));
  });
});

describe("views and shares", () => {
  it("send the stable visitor id", async () => {
    await posts.recordView(POST_ID);
    await posts.recordShare(POST_ID, "whatsapp");
    const visitor = localStorage.getItem("malani_visitor_id");
    expect(visitor).toMatch(/^[0-9a-f-]{36}$/);
    expect(sb.supabase.rpc).toHaveBeenCalledWith("record_post_view", { p_post_id: POST_ID, p_visitor_id: visitor });
    expect(sb.supabase.rpc).toHaveBeenCalledWith("record_post_share", { p_post_id: POST_ID, p_visitor_id: visitor, p_channel: "whatsapp" });
  });
});

describe("savePost", () => {
  const basePost = {
    title: "राजस्थान पुलिस भर्ती 2026",
    content: "<p>x</p>",
    image_url: null,
    category: "Government Job",
    tags: [],
    status: "published" as const,
    scheduled_at: null,
    language: "hi" as const,
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    source_url: null,
    official_link: null,
    is_verified: true,
    post_type: "job",
  };

  it("new published post: inserts as draft, saves job details, then publishes (so triggers see the job)", async () => {
    sb.on({ name: "posts", method: "insert" }, { data: { id: "new-id" } });
    const saved = await posts.savePost({ authorId: "admin-1", post: basePost, job: { organisation: "Police" } as never });
    expect(saved.id).toBe("new-id");
    expect(saved.slug).toMatch(/^[a-z0-9-]+-2026$/);
    const order = sb.calls.filter((c) => c.kind === "from").map((c) => `${c.name}.${c.ops[0]?.method}`);
    expect(order).toEqual(["posts.select", "posts.insert", "job_details.upsert", "posts.update"]);
    expect(opArgs(sb.find("posts", "insert")[0], "insert")?.[0]).toMatchObject({ status: "draft", author_id: "admin-1" });
    expect(opArgs(sb.find("job_details")[0], "upsert")).toEqual([{ organisation: "Police", post_id: "new-id" }, { onConflict: "post_id" }]);
    expect(opArgs(sb.find("posts", "update")[0], "update")).toEqual([{ status: "published" }]);
  });

  it("de-duplicates slugs with -2, -3", async () => {
    sb.on({ name: "posts", method: "like" }, { data: [{ id: "a", slug: "rpsc-ras" }, { id: "b", slug: "rpsc-ras-2" }] });
    sb.on({ name: "posts", method: "insert" }, { data: { id: "n" } });
    const saved = await posts.savePost({ authorId: "a", post: { ...basePost, title: "RPSC RAS", status: "draft" }, job: null });
    expect(saved.slug).toBe("rpsc-ras-3");
  });

  it("draft stays draft and needs no status flip", async () => {
    sb.on({ name: "posts", method: "insert" }, { data: { id: "n" } });
    await posts.savePost({ authorId: "a", post: { ...basePost, status: "draft" }, job: null });
    expect(sb.find("posts", "update")).toHaveLength(0);
  });

  it("editing a live post keeps it published and its slug; removing job details deletes them", async () => {
    sb.on({ name: "posts", method: "single" }, { data: { status: "published", slug: "old-slug" } });
    const saved = await posts.savePost({ id: "p1", authorId: "a", post: { ...basePost, title: "New title" }, job: null });
    expect(saved).toEqual({ id: "p1", slug: "old-slug" });
    const updates = sb.find("posts", "update");
    expect(updates).toHaveLength(1);
    expect(opArgs(updates[0], "update")?.[0]).toMatchObject({ title: "New title", status: "published" });
    expect(sb.find("job_details", "delete")).toHaveLength(1);
  });

  it("unpublishing a live post flips the status at the end", async () => {
    sb.on({ name: "posts", method: "single" }, { data: { status: "published", slug: "s" } });
    await posts.savePost({ id: "p1", authorId: "a", post: { ...basePost, status: "archived" }, job: null });
    const updates = sb.find("posts", "update");
    expect(opArgs(updates.at(-1), "update")).toEqual([{ status: "archived" }]);
  });

  it("surfaces insert errors", async () => {
    sb.on({ name: "posts", method: "insert" }, { error: { message: "violates check constraint" } });
    await expect(posts.savePost({ authorId: "a", post: basePost, job: null })).rejects.toEqual({ message: "violates check constraint" });
  });
});

describe("admin helpers", () => {
  it("listAdminPosts applies status, search and paging", async () => {
    sb.on({ name: "posts" }, { data: [{ id: "1" }], count: 31 });
    const res = await posts.listAdminPosts({ status: "draft", search: " ras ", limit: 10, offset: 20 });
    expect(res).toEqual({ items: [{ id: "1" }], total: 31 });
    const call = sb.find("posts")[0];
    expect(opArgs(call, "range")).toEqual([20, 29]);
    expect(opArgs(call, "eq")).toEqual(["status", "draft"]);
    expect(opArgs(call, "ilike")).toEqual(["title", "%ras%"]);
  });

  it("listAdminPosts with 'all' does not filter by status", async () => {
    await posts.listAdminPosts({ status: "all" });
    expect(opArgs(sb.find("posts")[0], "eq")).toBeUndefined();
  });

  it("deletePost and analytics propagate errors", async () => {
    sb.on({ name: "posts", method: "delete" }, { error: { message: "rls" } });
    await expect(posts.deletePost("x")).rejects.toEqual({ message: "rls" });
    sb.on({ name: "admin_blog_analytics" }, { data: { totals: { views: 3 } } });
    expect(await posts.getAdminAnalytics()).toEqual({ totals: { views: 3 } });
  });

  it("jobFieldsFromRow drops keys the editor must not send", () => {
    expect(posts.jobFieldsFromRow(null)).toBeNull();
    expect(posts.jobFieldsFromRow({ post_id: "p", updated_at: "t", organisation: "O" } as never)).toEqual({ organisation: "O" });
  });
});
