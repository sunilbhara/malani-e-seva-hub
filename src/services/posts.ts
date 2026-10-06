import { supabase } from "@/lib/supabase";
import { getVisitorId } from "@/lib/storage";
import type { Database, Json } from "@/integrations/supabase/types";
import type { JobStatus } from "@/lib/jobs";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type JobRow = Database["public"]["Tables"]["job_details"]["Row"];
type JobInsert = Database["public"]["Tables"]["job_details"]["Insert"];

export type PostStatus = "draft" | "scheduled" | "published" | "archived";

/** Card-sized post returned by the list_posts RPC (no HTML body). */
export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  category: string | null;
  tags: string[];
  post_type: string | null;
  published_at: string;
  updated_at: string;
  is_verified: boolean;
  read_time_min: number | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  share_count: number;
  organisation: string | null;
  total_posts: number | null;
  qualifications: string[] | null;
  departments: string[] | null;
  state: string | null;
  apply_start: string | null;
  last_date: string | null;
  exam_date: string | null;
  recruitment_id: string | null;
  job_status: JobStatus | null;
  days_left: number | null;
}

export interface ListPostsParams {
  postTypes?: string[];
  category?: string;
  tag?: string;
  search?: string;
  qualification?: string;
  department?: string;
  state?: string;
  jobStatus?: "active" | JobStatus;
  since?: string;
  excludeId?: string;
  ids?: string[];
  sort?: "latest" | "deadline" | "trending" | "posts";
  limit?: number;
  offset?: number;
}

export interface PostPage {
  items: PostListItem[];
  total: number;
}

export async function listPosts(params: ListPostsParams = {}): Promise<PostPage> {
  if (params.ids && params.ids.length === 0) return { items: [], total: 0 };
  const { data, error } = await supabase.rpc("list_posts", {
    p_post_types: params.postTypes?.length ? params.postTypes : undefined,
    p_category: params.category || undefined,
    p_tag: params.tag || undefined,
    p_search: params.search?.trim() || undefined,
    p_qualification: params.qualification || undefined,
    p_department: params.department || undefined,
    p_state: params.state || undefined,
    p_job_status: params.jobStatus || undefined,
    p_since: params.since || undefined,
    p_exclude_id: params.excludeId || undefined,
    p_ids: params.ids || undefined,
    p_sort: params.sort ?? "latest",
    p_limit: params.limit ?? 20,
    p_offset: params.offset ?? 0,
  });
  if (error) throw error;
  const rows = (data ?? []) as unknown as Array<PostListItem & { total_count: number }>;
  return {
    items: rows.map(({ total_count: _total, ...item }) => item),
    total: rows[0]?.total_count ?? 0,
  };
}

export interface AuthorProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export type PostDetail = PostRow & {
  job: JobRow | null;
  author: AuthorProfile | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Loads a post by slug (or by id for admin previews). RLS hides unpublished posts from readers. */
export async function getPost(identifier: string): Promise<PostDetail | null> {
  const column = UUID.test(identifier) ? "id" : "slug";
  const { data, error } = await supabase
    .from("posts")
    .select("*, job_details(*)")
    .eq(column, identifier)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { job_details, ...post } = data as PostRow & { job_details: JobRow | JobRow[] | null };
  const job = Array.isArray(job_details) ? job_details[0] ?? null : job_details;
  const { data: author } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", post.author_id)
    .maybeSingle();
  return { ...post, job, author: author ?? null };
}

export async function getRelatedPosts(post: Pick<PostDetail, "id" | "post_type" | "category" | "job">, limit = 4): Promise<PostListItem[]> {
  const department = post.job?.departments?.[0];
  const primary = await listPosts({
    excludeId: post.id,
    department,
    postTypes: department ? undefined : post.post_type ? [post.post_type] : undefined,
    limit,
  });
  if (primary.items.length >= limit) return primary.items;
  const fallback = await listPosts({ excludeId: post.id, limit: limit * 2 });
  const seen = new Set(primary.items.map((p) => p.id));
  return [...primary.items, ...fallback.items.filter((p) => !seen.has(p.id))].slice(0, limit);
}

/** Counts one view per visitor per day (deduplicated in the database, audit S2). */
export async function recordView(postId: string): Promise<void> {
  await supabase.rpc("record_post_view", { p_post_id: postId, p_visitor_id: getVisitorId() });
}

export async function recordShare(postId: string, channel: "whatsapp" | "telegram" | "native" | "copy" | "status_card"): Promise<void> {
  await supabase.rpc("record_post_share", { p_post_id: postId, p_visitor_id: getVisitorId(), p_channel: channel });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface AdminPostRow {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  post_type: string | null;
  category: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  updated_at: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  share_count: number;
}

export async function listAdminPosts(opts: { status?: PostStatus | "all"; search?: string; limit?: number; offset?: number } = {}) {
  let query = supabase
    .from("posts")
    .select("id, title, slug, status, post_type, category, published_at, scheduled_at, updated_at, views_count, likes_count, comments_count, share_count", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 25) - 1);
  if (opts.status && opts.status !== "all") query = query.eq("status", opts.status);
  if (opts.search?.trim()) query = query.ilike("title", `%${opts.search.trim()}%`);
  const { data, error, count } = await query;
  if (error) throw error;
  return { items: (data ?? []) as AdminPostRow[], total: count ?? 0 };
}

export interface PostInput {
  title: string;
  content: string;
  image_url: string | null;
  category: string | null;
  tags: string[];
  status: PostStatus;
  scheduled_at: string | null;
  language: "hi" | "en";
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  source_url: string | null;
  official_link: string | null;
  is_verified: boolean;
  post_type: string;
}

export type JobDetailsInput = Omit<JobInsert, "post_id" | "updated_at">;


async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const { baseSlug } = await import("@/lib/slug");
  const base = baseSlug(title);
  const { data, error } = await supabase.from("posts").select("id, slug").like("slug", `${base}%`);
  if (error) throw error;
  const taken = new Set((data ?? []).filter((r) => r.id !== excludeId).map((r) => r.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

/**
 * Creates or updates a post and its job details. When publishing, the post is saved first
 * as a draft, then job details, then the status flips — so the database notification and
 * broadcast triggers see the complete job data.
 */
export async function savePost(opts: {
  id?: string;
  authorId: string;
  post: PostInput;
  job: JobDetailsInput | null;
}): Promise<{ id: string; slug: string }> {
  const { post, job } = opts;
  const targetStatus = post.status;
  const goingLive = targetStatus === "published" || targetStatus === "scheduled";
  const firstPassStatus: PostStatus = goingLive ? "draft" : targetStatus;

  let id = opts.id;
  let slug: string;
  let wasLive = false;

  if (id) {
    const { data: current, error: currentError } = await supabase.from("posts").select("status, slug").eq("id", id).single();
    if (currentError) throw currentError;
    wasLive = current.status === "published";
    slug = current.slug;
    const { error } = await supabase
      .from("posts")
      .update({ ...post, status: wasLive ? current.status : firstPassStatus, scheduled_at: post.scheduled_at })
      .eq("id", id);
    if (error) throw error;
  } else {
    slug = await uniqueSlug(post.title);
    const { data, error } = await supabase
      .from("posts")
      .insert({ ...post, status: firstPassStatus, author_id: opts.authorId, slug })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id;
  }

  if (job) {
    const { error } = await supabase.from("job_details").upsert({ ...job, post_id: id }, { onConflict: "post_id" });
    if (error) throw error;
  } else if (opts.id) {
    await supabase.from("job_details").delete().eq("post_id", id);
  }

  if (goingLive && !(wasLive && targetStatus === "published")) {
    const { error } = await supabase.from("posts").update({ status: targetStatus }).eq("id", id);
    if (error) throw error;
  } else if (wasLive && targetStatus !== "published") {
    const { error } = await supabase.from("posts").update({ status: targetStatus }).eq("id", id);
    if (error) throw error;
  }

  return { id, slug };
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export interface BlogAnalytics {
  totals: {
    posts: number;
    published: number;
    drafts: number;
    scheduled: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    bookmarks: number;
  };
  subscribers: number;
  pending_subscribers: number;
  users: number;
  push_subscribers: number;
  reported_comments: number;
  categories: Array<{ category: string; count: number; views: number; likes: number }>;
  trending: Array<{ id: string; title: string; slug: string; views_count: number; likes_count: number; comments_count: number; share_count: number }>;
  views_last_14_days: Array<{ date: string; views: number }>;
}

/** Accurate totals computed in the database (audit B2). */
export async function getAdminAnalytics(): Promise<BlogAnalytics> {
  const { data, error } = await supabase.rpc("admin_blog_analytics");
  if (error) throw error;
  return data as unknown as BlogAnalytics;
}

export function jobFieldsFromRow(job: JobRow | null): JobDetailsInput | null {
  if (!job) return null;
  const { post_id: _p, updated_at: _u, ...rest } = job;
  return rest as JobDetailsInput;
}

export type { JobRow, PostRow, Json };
