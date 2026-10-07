// Broadcasts a newly published post to Telegram and web push subscribers (Blueprint Loop 1).
// Called by the posts_broadcast_on_publish database trigger. Only the database may call it
// (x-internal-token); it acts on published posts and claims each post once via posts.broadcast_at.
import { json, siteUrl } from "../_shared/http.ts";
import { adminClient } from "../_shared/supabase.ts";
import { sendPush } from "../_shared/push.ts";
import { isInternalCall } from "../_shared/internal.ts";
import { postTopics, pushPayload, telegramMessage, type PublishedPost } from "./message.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const admin = adminClient();
  if (!(await isInternalCall(req, admin))) return json({ error: "Forbidden" }, 403);
  const body = await req.json().catch(() => null);
  const postId = body?.post_id;
  if (typeof postId !== "string" || !UUID.test(postId)) return json({ error: "post_id required" }, 400);

  const { data: claimed, error } = await admin
    .from("posts")
    .update({ broadcast_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .is("broadcast_at", null)
    .select("id, title, slug, post_type, seo_description, excerpt");
  if (error) {
    console.error("claim failed", error);
    return json({ error: "claim failed" }, 500);
  }
  if (!claimed?.length) return json({ status: "skipped" });

  const { data: job } = await admin
    .from("job_details")
    .select("organisation, total_posts, last_date, qualifications, departments")
    .eq("post_id", postId)
    .maybeSingle();
  const post: PublishedPost = { ...(claimed[0] as PublishedPost), job };
  const site = siteUrl();
  const result = { telegram: false, push: 0 };

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (botToken && chatId) {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: telegramMessage(post, site), parse_mode: "HTML", disable_web_page_preview: false }),
    });
    result.telegram = res.ok;
    if (!res.ok) console.error("Telegram error", res.status, await res.text());
  }

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .overlaps("topics", postTopics(post));
  result.push = await sendPush(admin, subs ?? [], pushPayload(post, site));

  return json({ status: "sent", ...result });
});
