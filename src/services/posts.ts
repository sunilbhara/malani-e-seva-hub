import { supabase } from "@/lib/supabase";

export interface PostInput {
  title: string;
  content: string;
  image_url?: string | null;
}

// Fetch all posts and join author profile separately (RLS-safe).
export async function getPosts() {
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
  const { data, error } = await supabase
    .from("posts")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePost(id: string) {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}
