// In-app notifications created by database triggers (audit B3).
import { supabase } from "@/lib/supabase";

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
  read_at: string | null;
  post: { slug: string; title: string } | null;
}

export async function listNotifications(userId: string, limit = 20): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("user_notifications")
    .select("id, title, body, created_at, read_at, posts(slug, title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((n) => {
    const { posts, ...rest } = n as typeof n & { posts: AppNotification["post"] | AppNotification["post"][] };
    return { ...rest, post: Array.isArray(posts) ? posts[0] ?? null : posts };
  });
}

export async function unreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationsRead(ids?: string[]): Promise<void> {
  const { error } = await supabase.rpc("mark_notifications_read", { p_ids: ids });
  if (error) throw error;
}
