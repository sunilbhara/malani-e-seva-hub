import { supabase } from "@/lib/supabase";

export async function getComments(postId: string) {
  const { data: comments, error } = await supabase
    .from("comments")
    .select("id, content, user_id, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!comments || comments.length === 0) return [];
  const userIds = Array.from(new Set(comments.map((c) => c.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", userIds);
  const map = new Map((profiles ?? []).map((p) => [p.id, p]));
  return comments.map((c) => ({ ...c, user: map.get(c.user_id) ?? null }));
}

export async function addComment(postId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, user_id: userId, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}
