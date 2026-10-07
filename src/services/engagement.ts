// Likes ("उपयोगी लगा") and bookmarks (saved jobs).
import { supabase } from "@/lib/supabase";
import { clearLocalSaves, loadSavedIds } from "@/lib/savedPosts";

export async function hasLiked(postId: string, userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("post_likes")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId)
    .eq("user_id", userId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function setLiked(postId: string, userId: string, liked: boolean): Promise<void> {
  if (liked) {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) throw error;
  }
}

export async function listBookmarkIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("post_bookmarks")
    .select("post_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((r) => r.post_id);
}

export async function setBookmarked(postId: string, userId: string, saved: boolean): Promise<void> {
  if (saved) {
    const { error } = await supabase.from("post_bookmarks").insert({ post_id: postId, user_id: userId });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase.from("post_bookmarks").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) throw error;
  }
}

/** After login, moves guest saves into the account (audit U6). */
export async function syncLocalSaves(userId: string): Promise<number> {
  const local = loadSavedIds();
  if (!local.length) return 0;
  const { error } = await supabase
    .from("post_bookmarks")
    .upsert(local.map((post_id) => ({ post_id, user_id: userId })), { onConflict: "post_id,user_id", ignoreDuplicates: true });
  if (error) throw error;
  clearLocalSaves();
  return local.length;
}
