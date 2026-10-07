// Sunday weekly email digest to confirmed subscribers (Blueprint Loop 1).
// Run weekly by pg_cron; only the database may call it. Idempotent per calendar week via newsletter_sends.
import { json, siteUrl } from "../_shared/http.ts";
import { adminClient } from "../_shared/supabase.ts";
import { emailConfigured, sendEmails } from "../_shared/email.ts";
import { digestEmail, type DigestItem } from "../newsletter/templates.ts";
import { isInternalCall } from "../_shared/internal.ts";
import { weekStartIst } from "./week.ts";

function istDate(offsetDays = 0): string {
  const now = new Date(Date.now() + 330 * 60_000 + offsetDays * 86_400_000);
  return now.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const admin = adminClient();
  if (!(await isInternalCall(req, admin))) return json({ error: "Forbidden" }, 403);
  if (!emailConfigured()) return json({ status: "skipped", reason: "email not configured" });

  // One digest per calendar week (Monday-based, IST), however often this is called.
  const weekStart = weekStartIst();
  const { error: claimError } = await admin.from("newsletter_sends").insert({ week_start: weekStart });
  if (claimError) return json({ status: "skipped", reason: "already sent" });

  const site = siteUrl();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: recent } = await admin
    .from("posts")
    .select("title, slug, job_details(last_date, total_posts)")
    .eq("status", "published")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(15);
  const { data: closing } = await admin
    .from("job_details")
    .select("last_date, total_posts, posts!inner(title, slug, status)")
    .eq("posts.status", "published")
    .gte("last_date", istDate(0))
    .lte("last_date", istDate(7))
    .order("last_date", { ascending: true })
    .limit(10);

  type JD = { last_date: string | null; total_posts: number | null };
  const one = <T>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);
  const newItems: DigestItem[] = (recent ?? []).map((p) => {
    const jd = one(p.job_details as JD | JD[] | null);
    return { title: p.title, url: `${site}/blog/${p.slug}?utm_source=email&utm_medium=digest`, lastDate: jd?.last_date, totalPosts: jd?.total_posts };
  });
  const closingItems: DigestItem[] = (closing ?? []).map((c) => {
    const post = one(c.posts as { title: string; slug: string } | { title: string; slug: string }[]);
    return { title: post?.title ?? "", url: `${site}/blog/${post?.slug}?utm_source=email&utm_medium=digest`, lastDate: c.last_date, totalPosts: c.total_posts };
  }).filter((i) => i.title);

  if (!newItems.length && !closingItems.length) return json({ status: "skipped", reason: "nothing new" });

  const { data: subscribers } = await admin
    .from("newsletter_subscribers")
    .select("email, unsubscribe_token")
    .eq("is_active", true)
    .not("confirmed_at", "is", null)
    .is("unsubscribed_at", null);

  const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/newsletter`;
  const emails = (subscribers ?? []).map((s) => {
    const unsubscribeUrl = `${fnUrl}?action=unsubscribe&token=${s.unsubscribe_token}`;
    const mail = digestEmail(newItems, closingItems, unsubscribeUrl, site);
    return {
      to: s.email,
      subject: mail.subject,
      html: mail.html,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    };
  });
  const sent = await sendEmails(emails);
  await admin.from("newsletter_sends").update({ sent_count: sent }).eq("week_start", weekStart);
  return json({ status: "sent", sent });
});
