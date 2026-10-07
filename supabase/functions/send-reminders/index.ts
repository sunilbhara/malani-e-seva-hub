// Deadline reminders 3 days and 1 day before a job's last date (Blueprint Loop 2).
// Run daily by pg_cron. Idempotent: each reminder stage is marked as sent once.
import { json, siteUrl } from "../_shared/http.ts";
import { adminClient } from "../_shared/supabase.ts";
import { sendPush, type PushTarget } from "../_shared/push.ts";
import { reminderText } from "./text.ts";
import { isInternalCall } from "../_shared/internal.ts";

interface DueReminder {
  reminder_id: string;
  stage: "3d" | "1d";
  post_id: string;
  user_id: string | null;
  push_endpoint: string | null;
  title: string;
  slug: string;
  last_date: string;
  organisation: string | null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const admin = adminClient();
  if (!(await isInternalCall(req, admin))) return json({ error: "Forbidden" }, 403);
  const { data, error } = await admin.rpc("due_reminders");
  if (error) {
    console.error("due_reminders failed", error);
    return json({ error: "lookup failed" }, 500);
  }
  const due = (data ?? []) as DueReminder[];
  const site = siteUrl();
  let pushed = 0;
  let inApp = 0;

  for (const r of due) {
    const text = reminderText(r);
    const url = `${site}/blog/${encodeURIComponent(r.slug)}?utm_source=push&utm_medium=reminder`;
    let targets: PushTarget[] = [];
    if (r.push_endpoint) {
      const { data: sub } = await admin.from("push_subscriptions").select("endpoint, p256dh, auth").eq("endpoint", r.push_endpoint);
      targets = sub ?? [];
    } else if (r.user_id) {
      const { data: subs } = await admin.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", r.user_id);
      targets = subs ?? [];
      const { error: notifyError } = await admin
        .from("user_notifications")
        .insert({ user_id: r.user_id, post_id: r.post_id, title: text.title, body: text.body });
      if (!notifyError) inApp += 1;
    }
    pushed += await sendPush(admin, targets, { ...text, url, tag: `reminder-${r.post_id}` });
    await admin
      .from("job_reminders")
      .update(r.stage === "3d" ? { sent_3d_at: new Date().toISOString() } : { sent_1d_at: new Date().toISOString() })
      .eq("id", r.reminder_id);
  }

  return json({ status: "ok", due: due.length, pushed, inApp });
});
