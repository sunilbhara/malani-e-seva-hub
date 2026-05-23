import { supabase } from "@/lib/supabase";
import { postExcerpt, readTimeMinutes } from "@/lib/blogUtils";
import { slugify } from "transliteration";

type SupabaseDynamic = typeof supabase & {
  from(table: string): ReturnType<typeof supabase.from>;
};

const db = supabase as SupabaseDynamic;

export interface PostInput {
  title: string;
  content: string;
  image_url?: string | null;
  category?: string | null;
  tags?: string[];
  status?: "draft" | "scheduled" | "published" | "archived";
  scheduled_at?: string | null;
  published_at?: string | null;
  language?: "hi" | "en";
  seo_title?: string | null;
  seo_description?: string | null;
  og_image_url?: string | null;
  canonical_url?: string | null;
  source_url?: string | null;
  official_link?: string | null;
  is_verified?: boolean;
  post_type?: "article" | "job" | "admit_card" | "result" | "exam" | "local_news" | "guide";
}

export interface PostAuthorProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface PostWithAuthor {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  author_id: string;
  created_at: string;
  updated_at?: string;
  author: PostAuthorProfile | null;
  slug?: string | null;
  category?: string | null;
  tags?: string[];
  status?: "draft" | "scheduled" | "published" | "archived";
  scheduled_at?: string | null;
  published_at?: string | null;
  language?: "hi" | "en";
  seo_title?: string | null;
  seo_description?: string | null;
  og_image_url?: string | null;
  canonical_url?: string | null;
  source_url?: string | null;
  official_link?: string | null;
  is_verified?: boolean;
  post_type?: "article" | "job" | "admit_card" | "result" | "exam" | "local_news" | "guide";
  share_count?: number;
}

export type PostWithStats = PostWithAuthor & {
  comments_count: number;
  likes_count: number;
  views_count: number;
  bookmarks_count: number;
  reactions_count: number;
  read_time_min: number;
  excerpt: string;
};

export type BlogAnalytics = {
  totals: {
    posts: number;
    published: number;
    drafts: number;
    scheduled: number;
    comments: number;
    likes: number;
    views: number;
    shares: number;
    bookmarks: number;
    subscribers: number;
  };
  trending: PostWithStats[];
  categories: Array<{ category: string; count: number; views: number; likes: number }>;
};

const POST_COLUMNS =
  "id, title, content, image_url, author_id, created_at, updated_at, slug, category, tags, status, scheduled_at, published_at, language, seo_title, seo_description, og_image_url, canonical_url, source_url, official_link, is_verified, post_type, share_count";

function normalizeInput(input: Partial<PostInput>) {
  const cleanInput = Object.fromEntries(
    Object.entries(input).filter(([_, v]) => v !== undefined)
  ) as Partial<PostInput>;

  if (Array.isArray(cleanInput.tags)) {
    cleanInput.tags = Array.from(
      new Set(cleanInput.tags.map((t) => t.trim()).filter(Boolean))
    );
  }

  if (cleanInput.status === "published" && !cleanInput.published_at) {
    cleanInput.published_at = new Date().toISOString();
  }

  return cleanInput;
}

// Fetch all posts and join author profile separately (RLS-safe).
export async function getPosts(): Promise<PostWithAuthor[]> {
  const { data: posts, error } = await db
    .from("posts")
    .select(POST_COLUMNS)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  if (error) throw error;
  return attachAuthors(posts ?? []);
}

export async function getAdminPosts(): Promise<PostWithAuthor[]> {
  const { data: posts, error } = await db
    .from("posts")
    .select(POST_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return attachAuthors(posts ?? []);
}

async function attachAuthors(posts: Array<PostWithAuthor & { author?: PostAuthorProfile | null }>): Promise<PostWithAuthor[]> {
  if (!posts || posts.length === 0) return [];
  const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", authorIds);
  const map = new Map((profiles ?? []).map((p) => [p.id, p]));
  return posts.map((p) => ({ ...p, author: map.get(p.author_id) ?? null }));
}

/** Posts with engagement counts and excerpt for the blog listing UI. */
export async function getPostsWithStats(): Promise<PostWithStats[]> {
  const posts = await getPosts();
  if (posts.length === 0) return [];

  const ids = posts.map((p) => p.id);
  const [commentsRes, likesRes, viewsRes, bookmarksRes, reactionsRes] = await Promise.all([
    supabase.from("comments").select("post_id").in("post_id", ids),
    supabase.from("post_likes").select("post_id").in("post_id", ids),
    db.from("post_views").select("post_id").in("post_id", ids),
    db.from("post_bookmarks").select("post_id").in("post_id", ids),
    db.from("post_reactions").select("post_id").in("post_id", ids),
  ]);
  for (const res of [commentsRes, likesRes, viewsRes, bookmarksRes, reactionsRes]) {
    if (res.error) throw res.error;
  }

  const countByPost = (rows: Array<{ post_id: string }> | null | undefined) => {
    const counts = new Map<string, number>();
    for (const row of rows ?? []) {
      const pid = row.post_id as string;
      counts.set(pid, (counts.get(pid) ?? 0) + 1);
    }
    return counts;
  };

  const commentCounts = countByPost(commentsRes.data);
  const likeCounts = countByPost(likesRes.data);
  const viewCounts = countByPost(viewsRes.data);
  const bookmarkCounts = countByPost(bookmarksRes.data);
  const reactionCounts = countByPost(reactionsRes.data);

  return posts.map((p) => ({
    ...p,
    comments_count: commentCounts.get(p.id) ?? 0,
    likes_count: likeCounts.get(p.id) ?? 0,
    views_count: viewCounts.get(p.id) ?? 0,
    bookmarks_count: bookmarkCounts.get(p.id) ?? 0,
    reactions_count: reactionCounts.get(p.id) ?? 0,
    read_time_min: readTimeMinutes(p.content),
    excerpt: postExcerpt(p.content),
  }));
}

export async function getAdminAnalytics(): Promise<BlogAnalytics> {
  const posts = await getAdminPosts();
  const ids = posts.map((p) => p.id);
  const [commentsRes, likesRes, viewsRes, bookmarksRes, subscribersRes] = await Promise.all([
    supabase.from("comments").select("post_id"),
    supabase.from("post_likes").select("post_id"),
    db.from("post_views").select("post_id"),
    db.from("post_bookmarks").select("post_id"),
    db.from("newsletter_subscribers").select("id").eq("is_active", true),
  ]);
  for (const res of [commentsRes, likesRes, viewsRes, bookmarksRes, subscribersRes]) {
    if (res.error) throw res.error;
  }

  const countByPost = (rows: Array<{ post_id: string }> | null | undefined) => {
    const counts = new Map<string, number>();
    for (const row of rows ?? []) {
      const pid = row.post_id as string;
      counts.set(pid, (counts.get(pid) ?? 0) + 1);
    }
    return counts;
  };
  const commentCounts = countByPost(commentsRes.data);
  const likeCounts = countByPost(likesRes.data);
  const viewCounts = countByPost(viewsRes.data);
  const bookmarkCounts = countByPost(bookmarksRes.data);

  const withStats = posts.map((p) => ({
    ...p,
    comments_count: commentCounts.get(p.id) ?? 0,
    likes_count: likeCounts.get(p.id) ?? 0,
    views_count: viewCounts.get(p.id) ?? 0,
    bookmarks_count: bookmarkCounts.get(p.id) ?? 0,
    reactions_count: 0,
    read_time_min: readTimeMinutes(p.content),
    excerpt: postExcerpt(p.content),
  }));

  const categories = new Map<string, { category: string; count: number; views: number; likes: number }>();
  for (const post of withStats) {
    const key = post.category || "general";
    const current = categories.get(key) ?? { category: key, count: 0, views: 0, likes: 0 };
    current.count += 1;
    current.views += post.views_count;
    current.likes += post.likes_count;
    categories.set(key, current);
  }

  return {
    totals: {
      posts: posts.length,
      published: posts.filter((p) => p.status === "published").length,
      drafts: posts.filter((p) => p.status === "draft").length,
      scheduled: posts.filter((p) => p.status === "scheduled").length,
      comments: commentsRes.data?.length ?? 0,
      likes: likesRes.data?.length ?? 0,
      views: viewsRes.data?.length ?? 0,
      shares: posts.reduce((sum, p) => sum + (p.share_count ?? 0), 0),
      bookmarks: bookmarksRes.data?.length ?? 0,
      subscribers: subscribersRes.data?.length ?? 0,
    },
    trending: withStats
      .filter((p) => p.status === "published")
      .sort((a, b) => b.views_count + b.likes_count * 3 + b.comments_count * 2 - (a.views_count + a.likes_count * 3 + a.comments_count * 2))
      .slice(0, 5),
    categories: Array.from(categories.values()).sort((a, b) => b.views - a.views),
  };
}

export async function getTaxonomy() {
  const posts = await getPosts();
  const categories = Array.from(new Set(posts.map((p) => p.category || "general"))).sort();
  const tags = Array.from(new Set(posts.flatMap((p) => p.tags ?? []))).sort();
  return { categories, tags };
}

export async function getPostById(id: string) {
  const { data: post, error } = await db
    .from("posts")
    .select(POST_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!post) return null;
  const { data: author } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", post.author_id)
    .maybeSingle();
  return { ...post, author: author ?? null };
}

export async function getPostByIdentifier(identifier: string) {
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(identifier);
  const column = isUuid ? "id" : "slug";
  const { data: post, error } = await db
    .from("posts")
    .select(POST_COLUMNS)
    .eq(column, identifier)
    .maybeSingle();
  if (error) throw error;
  if (!post) return null;
  const { data: author } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", post.author_id)
    .maybeSingle();
  return { ...post, author: author ?? null };
}

export async function createPost(input: PostInput, authorId: string) {
  // Generate SEO-friendly multilingual slug in application code (stable once created)
  const base = slugify(input.title || "", { lowercase: true, separator: "-" }).replace(/(^-+|-+$)/g, "");
  const safeBase = base || "post";
  let candidate = safeBase;
  let i = 1;
  while (true) {
    const { data: exists, error: e } = await db.from("posts").select("id").eq("slug", candidate).limit(1);
    if (e) throw e;
    if (!exists || exists.length === 0) break;
    i += 1;
    candidate = `${safeBase}-${i}`;
  }

  const { data, error } = await db
    .from("posts")
    .insert({ ...normalizeInput(input), author_id: authorId, slug: candidate })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePost(id: string, input: Partial<PostInput>) {
  const cleanInput = normalizeInput(input);

  const { data, error } = await db
    .from("posts")
    .update(cleanInput)
    .eq("id", id)
    .select();

  if (error) throw error;

  return data?.[0];
}

export async function deletePost(id: string) {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export async function recordPostView(postId: string, userId?: string | null) {
  const key = `blog-viewed-${postId}`;
  if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
  const visitorId =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("malani_visitor_id") || crypto.randomUUID()
      : null;
  if (visitorId && typeof localStorage !== "undefined") {
    localStorage.setItem("malani_visitor_id", visitorId);
  }
  const { error } = await db
    .from("post_views")
    .insert({ post_id: postId, user_id: userId ?? null, visitor_id: visitorId });
  if (!error && typeof sessionStorage !== "undefined") sessionStorage.setItem(key, "1");
}

export async function incrementShareCount(postId: string, currentCount = 0) {
  const { error } = await db
    .from("posts")
    .update({ share_count: currentCount + 1 })
    .eq("id", postId);
  if (error) throw error;
}
