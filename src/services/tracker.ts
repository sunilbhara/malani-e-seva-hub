// Recruitment follows (application tracker) and deadline reminders (Blueprint Loops 2–3).
import { supabase } from "@/lib/supabase";
import { currentSubscription } from "@/lib/push";

export interface Recruitment {
  id: string;
  name: string;
  organisation: string;
}

export interface FollowRow {
  recruitment_id: string;
  applied: boolean;
  applied_at: string | null;
  created_at: string;
  recruitment: Recruitment | null;
}

export async function listRecruitments(search = ""): Promise<Recruitment[]> {
  let q = supabase.from("recruitments").select("id, name, organisation").order("created_at", { ascending: false }).limit(50);
  if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createRecruitment(name: string, organisation: string): Promise<Recruitment> {
  const { data, error } = await supabase
    .from("recruitments")
    .insert({ name: name.trim(), organisation: organisation.trim() })
    .select("id, name, organisation")
    .single();
  if (error) throw error;
  return data;
}

export async function listFollows(userId: string): Promise<FollowRow[]> {
  const { data, error } = await supabase
    .from("recruitment_follows")
    .select("recruitment_id, applied, applied_at, created_at, recruitments(id, name, organisation)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { recruitments, ...rest } = row as typeof row & { recruitments: Recruitment | Recruitment[] | null };
    return { ...rest, recruitment: Array.isArray(recruitments) ? recruitments[0] ?? null : recruitments };
  });
}

export async function setFollow(recruitmentId: string, userId: string, follow: boolean): Promise<void> {
  if (follow) {
    const { error } = await supabase
      .from("recruitment_follows")
      .upsert({ recruitment_id: recruitmentId, user_id: userId }, { onConflict: "user_id,recruitment_id", ignoreDuplicates: true });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("recruitment_follows").delete().eq("recruitment_id", recruitmentId).eq("user_id", userId);
    if (error) throw error;
  }
}

export async function setApplied(recruitmentId: string, userId: string, applied: boolean): Promise<void> {
  const { error } = await supabase
    .from("recruitment_follows")
    .upsert(
      { recruitment_id: recruitmentId, user_id: userId, applied, applied_at: applied ? new Date().toISOString() : null },
      { onConflict: "user_id,recruitment_id" },
    );
  if (error) throw error;
}

/** Posts in a recruitment series (notification → admit card → result) for the tracker timeline. */
export async function recruitmentTimeline(recruitmentIds: string[]) {
  if (!recruitmentIds.length) return [];
  const { data, error } = await supabase
    .from("job_details")
    .select("recruitment_id, last_date, exam_date, admit_card_date, result_date, posts!inner(id, title, slug, post_type, published_at, status)")
    .in("recruitment_id", recruitmentIds);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { posts, ...rest } = row as typeof row & {
      posts: { id: string; title: string; slug: string; post_type: string | null; published_at: string | null } | Array<{ id: string; title: string; slug: string; post_type: string | null; published_at: string | null }>;
    };
    return { ...rest, post: Array.isArray(posts) ? posts[0] : posts };
  });
}

// --- Reminders -------------------------------------------------------------

export async function listReminderPostIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("job_reminders").select("post_id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.post_id);
}

export async function setReminder(postId: string, userId: string | null, enabled: boolean): Promise<void> {
  if (userId) {
    if (enabled) {
      const { error } = await supabase.from("job_reminders").insert({ post_id: postId, user_id: userId });
      if (error && error.code !== "23505") throw error;
    } else {
      const { error } = await supabase.from("job_reminders").delete().eq("post_id", postId).eq("user_id", userId);
      if (error) throw error;
    }
    return;
  }
  const subscription = await currentSubscription();
  if (!subscription) throw new Error("NEEDS_PUSH");
  const { error } = await supabase.rpc("set_push_reminder", { p_post_id: postId, p_endpoint: subscription.endpoint, p_enabled: enabled });
  if (error) throw error;
}

/** Calendar file fallback for readers without push notifications. */
export function reminderIcs(title: string, lastDate: string, url: string): string {
  const day = lastDate.replace(/-/g, "");
  const reminderDay = new Date(`${lastDate}T00:00:00Z`);
  reminderDay.setUTCDate(reminderDay.getUTCDate() - 1);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Malani Barmer//Job reminder//HI",
    "BEGIN:VEVENT",
    `UID:${day}-${Math.random().toString(36).slice(2)}@malanibarmer.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${day}`,
    `SUMMARY:${esc(`अंतिम तिथि: ${title}`)}`,
    `DESCRIPTION:${esc(`आवेदन की अंतिम तिथि। जानकारी: ${url}`)}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`कल अंतिम दिन: ${title}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
