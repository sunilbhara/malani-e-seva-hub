// Q&A on posts: questions with answers, pinned admin answers, reports and moderation (audit S9, Loop 6).
import { supabase } from "@/lib/supabase";

export interface CommentAuthor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface QaComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_pinned: boolean;
  is_hidden: boolean;
  created_at: string;
  author: CommentAuthor | null;
  isAdminAnswer: boolean;
}

export interface QaThread extends QaComment {
  replies: QaComment[];
}

export const COMMENT_MAX = 2000;

async function authorsFor(userIds: string[]): Promise<Map<string, CommentAuthor>> {
  if (!userIds.length) return new Map();
  const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
  return new Map((data ?? []).map((p) => [p.id, p]));
}

/** Questions ordered: pinned first, then newest; replies oldest first. */
export async function getThreads(postId: string, adminIds: string[] = []): Promise<QaThread[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, user_id, parent_id, content, is_pinned, is_hidden, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw error;
  const rows = data ?? [];
  const authors = await authorsFor(Array.from(new Set(rows.map((r) => r.user_id))));
  const admins = new Set(adminIds);
  const withAuthor = rows.map((r) => ({ ...r, author: authors.get(r.user_id) ?? null, isAdminAnswer: admins.has(r.user_id) || r.is_pinned }));
  const repliesByParent = new Map<string, QaComment[]>();
  for (const c of withAuthor) {
    if (!c.parent_id) continue;
    repliesByParent.set(c.parent_id, [...(repliesByParent.get(c.parent_id) ?? []), c]);
  }
  return withAuthor
    .filter((c) => !c.parent_id)
    .map((c) => ({
      ...c,
      replies: (repliesByParent.get(c.id) ?? []).sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned)),
    }))
    .sort((a, b) => {
      const pinA = a.is_pinned || a.replies.some((r) => r.is_pinned);
      const pinB = b.is_pinned || b.replies.some((r) => r.is_pinned);
      if (pinA !== pinB) return pinA ? -1 : 1;
      return b.created_at.localeCompare(a.created_at);
    });
}

export function friendlyCommentError(error: unknown): string {
  const message = (error as { message?: string })?.message ?? "";
  if (message.includes("RATE_LIMIT")) return "आप बहुत जल्दी-जल्दी लिख रहे हैं। कृपया कुछ मिनट बाद कोशिश करें।";
  if (message.includes("comments_content_length")) return `सवाल 1 से ${COMMENT_MAX} अक्षरों के बीच होना चाहिए।`;
  if (message.includes("closed")) return "इस पोस्ट पर अभी सवाल नहीं पूछे जा सकते।";
  return "सवाल पोस्ट नहीं हो सका। कृपया दोबारा कोशिश करें।";
}

export async function postComment(input: { postId: string; userId: string; content: string; parentId?: string | null }): Promise<void> {
  const content = input.content.trim();
  if (!content || content.length > COMMENT_MAX) throw new Error("comments_content_length");
  const { error } = await supabase.from("comments").insert({
    post_id: input.postId,
    user_id: input.userId,
    content,
    parent_id: input.parentId ?? null,
  });
  if (error) throw error;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}

export async function reportComment(commentId: string, userId: string, reason?: string): Promise<void> {
  const { error } = await supabase
    .from("comment_reports")
    .insert({ comment_id: commentId, reporter_id: userId, reason: reason?.slice(0, 300) || null });
  if (error && error.code !== "23505") throw error;
}

export async function moderateComment(id: string, changes: { hidden?: boolean; pinned?: boolean }): Promise<void> {
  const { error } = await supabase.rpc("moderate_comment", {
    p_comment_id: id,
    p_hidden: changes.hidden,
    p_pinned: changes.pinned,
  });
  if (error) throw error;
}

export interface ModerationItem {
  id: string;
  content: string;
  created_at: string;
  is_hidden: boolean;
  is_pinned: boolean;
  parent_id: string | null;
  post_id: string;
  user_id: string;
  reports: number;
  post: { title: string; slug: string } | null;
  author: CommentAuthor | null;
}

/** Recent and reported questions for the admin moderation queue. */
export async function getModerationQueue(limit = 50): Promise<ModerationItem[]> {
  const [{ data: comments, error }, { data: reports }] = await Promise.all([
    supabase
      .from("comments")
      .select("id, content, created_at, is_hidden, is_pinned, parent_id, post_id, user_id, posts(title, slug)")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("comment_reports").select("comment_id"),
  ]);
  if (error) throw error;
  const reportCounts = new Map<string, number>();
  for (const r of reports ?? []) reportCounts.set(r.comment_id, (reportCounts.get(r.comment_id) ?? 0) + 1);
  const authors = await authorsFor(Array.from(new Set((comments ?? []).map((c) => c.user_id))));
  return (comments ?? [])
    .map((c) => {
      const { posts, ...rest } = c as typeof c & { posts: { title: string; slug: string } | { title: string; slug: string }[] | null };
      return {
        ...rest,
        reports: reportCounts.get(c.id) ?? 0,
        post: Array.isArray(posts) ? posts[0] ?? null : posts,
        author: authors.get(c.user_id) ?? null,
      };
    })
    .sort((a, b) => b.reports - a.reports || b.created_at.localeCompare(a.created_at));
}
