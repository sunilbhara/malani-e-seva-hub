import { supabase } from "@/lib/supabase";
import { postExcerpt, readTimeMinutes } from "@/lib/blogUtils";

export interface PostInput {
  title: string;
  content: string;
  image_url?: string | null;
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
  author: PostAuthorProfile | null;
}

export type PostWithStats = PostWithAuthor & {
  comments_count: number;
  likes_count: number;
  read_time_min: number;
  excerpt: string;
};

// Fetch all posts and join author profile separately (RLS-safe).
export async function getPosts(): Promise<PostWithAuthor[]> {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, content, image_url, author_id, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
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
  const [commentsRes, likesRes] = await Promise.all([
    supabase.from("comments").select("post_id").in("post_id", ids),
    supabase.from("post_likes").select("post_id").in("post_id", ids),
  ]);
  if (commentsRes.error) throw commentsRes.error;
  if (likesRes.error) throw likesRes.error;

  const commentCounts = new Map<string, number>();
  for (const row of commentsRes.data ?? []) {
    const pid = row.post_id as string;
    commentCounts.set(pid, (commentCounts.get(pid) ?? 0) + 1);
  }
  const likeCounts = new Map<string, number>();
  for (const row of likesRes.data ?? []) {
    const pid = row.post_id as string;
    likeCounts.set(pid, (likeCounts.get(pid) ?? 0) + 1);
  }

  return posts.map((p) => ({
    ...p,
    comments_count: commentCounts.get(p.id) ?? 0,
    likes_count: likeCounts.get(p.id) ?? 0,
    read_time_min: readTimeMinutes(p.content),
    excerpt: postExcerpt(p.content),
  }));
}

export async function getPostById(id: string) {
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, title, content, image_url, author_id, created_at, updated_at")
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

export async function createPost(input: PostInput, authorId: string) {
  const { data, error } = await supabase
    .from("posts")
    .insert({ ...input, author_id: authorId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePost(id: string, input: Partial<PostInput>) {
  const cleanInput = Object.fromEntries(
    Object.entries(input).filter(([_, v]) => v !== undefined)
  ) as Partial<PostInput>;

  const { data, error } = await supabase
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
