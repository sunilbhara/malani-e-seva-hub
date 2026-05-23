import { supabase } from "@/lib/supabase";
import { getPostsWithStats, type PostWithStats } from "@/services/posts";

export type ReactionType = "helpful" | "important" | "informative" | "urgent";

type SupabaseDynamic = typeof supabase & {
  from(table: string): ReturnType<typeof supabase.from>;
};

const db = supabase as SupabaseDynamic;

export async function hasUserBookmarked(postId: string, userId: string) {
  const { data, error } = await db
    .from("post_bookmarks")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

export async function bookmarkPost(postId: string, userId: string) {
  const { error } = await db
    .from("post_bookmarks")
    .insert({ post_id: postId, user_id: userId });
  if (error && error.code !== "23505") throw error;
}

export async function unbookmarkPost(postId: string, userId: string) {
  const { error } = await db
    .from("post_bookmarks")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getUserReactions(postId: string, userId: string) {
  const { data, error } = await db
    .from("post_reactions")
    .select("reaction")
    .eq("post_id", postId)
    .eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((row: { reaction: ReactionType }) => row.reaction));
}

export async function getReactionCounts(postId: string) {
  const { data, error } = await db
    .from("post_reactions")
    .select("reaction")
    .eq("post_id", postId);
  if (error) throw error;
  return (data ?? []).reduce<Record<ReactionType, number>>(
    (acc, row: { reaction: ReactionType }) => {
      acc[row.reaction] += 1;
      return acc;
    },
    { helpful: 0, important: 0, informative: 0, urgent: 0 },
  );
}

export async function toggleReaction(postId: string, userId: string, reaction: ReactionType, active: boolean) {
  if (active) {
    const { error } = await db
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("reaction", reaction);
    if (error) throw error;
    return;
  }

  const { error } = await db
    .from("post_reactions")
    .insert({ post_id: postId, user_id: userId, reaction });
  if (error && error.code !== "23505") throw error;
}

export async function subscribeNewsletter(email: string, categories: string[] = []) {
  const { error } = await db
    .from("newsletter_subscribers")
    .upsert(
      { email: email.trim().toLowerCase(), categories, is_active: true },
      { onConflict: "email" },
    );
  if (error) throw error;
}

export async function getUserNotifications(userId: string) {
  const { data, error } = await db
    .from("user_notifications")
    .select("id, post_id, title, body, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

export async function createNotificationsForNewPost(postId: string, title: string, body: string) {
  const { data: roles, error } = await db
    .from("user_roles")
    .select("user_id")
    .eq("role", "user");
  if (error) throw error;
  const payload = Array.from(new Set((roles ?? []).map((r: { user_id: string }) => r.user_id))).map((userId) => ({
    user_id: userId,
    post_id: postId,
    title,
    body,
  }));
  if (payload.length === 0) return;
  const { error: insertError } = await db.from("user_notifications").insert(payload);
  if (insertError) throw insertError;
}

export async function getUserProfileSummary(userId: string): Promise<{
  bookmarked: PostWithStats[];
  liked: PostWithStats[];
  comments: Array<{ id: string; content: string; created_at: string; post_id: string; post_title?: string; post_slug?: string | null }>;
}> {
  const [posts, bookmarksRes, likesRes, commentsRes] = await Promise.all([
    getPostsWithStats(),
    db.from("post_bookmarks").select("post_id").eq("user_id", userId),
    supabase.from("post_likes").select("post_id").eq("user_id", userId),
    supabase.from("comments").select("id, content, created_at, post_id").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  for (const res of [bookmarksRes, likesRes, commentsRes]) {
    if (res.error) throw res.error;
  }

  const postMap = new Map(posts.map((post) => [post.id, post]));
  const bookmarkedIds = new Set((bookmarksRes.data ?? []).map((row: { post_id: string }) => row.post_id));
  const likedIds = new Set((likesRes.data ?? []).map((row: { post_id: string }) => row.post_id));

  return {
    bookmarked: posts.filter((post) => bookmarkedIds.has(post.id)),
    liked: posts.filter((post) => likedIds.has(post.id)),
    comments: (commentsRes.data ?? []).map((comment: { id: string; content: string; created_at: string; post_id: string }) => ({
      ...comment,
      post_title: postMap.get(comment.post_id)?.title,
      post_slug: postMap.get(comment.post_id)?.slug,
    })),
  };
}
