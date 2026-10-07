// Newsletter with double opt-in (audit S7).
// POST {action:"subscribe", email, categories, consent:true, turnstileToken}
// GET  ?action=confirm&token=...      → redirects to /newsletter?status=confirmed
// GET  ?action=unsubscribe&token=...  → redirects to /newsletter?status=unsubscribed
import { corsHeadersFor, json, redirect, siteUrl } from "../_shared/http.ts";
import { adminClient } from "../_shared/supabase.ts";
import { emailConfigured, sendEmails } from "../_shared/email.ts";
import { clientIp, verifyTurnstile } from "../_shared/turnstile.ts";
import { CONSENT_TEXT, confirmEmail, isValidEmail } from "./templates.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RESEND_COOLDOWN_MS = 10 * 60 * 1000;

function functionUrl(): string {
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/newsletter`;
}

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const admin = adminClient();

  if (req.method === "GET") {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const token = url.searchParams.get("token") ?? "";
    if (!UUID.test(token)) return redirect(`${siteUrl()}/newsletter?status=invalid`);

    if (action === "confirm") {
      const { data } = await admin
        .from("newsletter_subscribers")
        .update({ confirmed_at: new Date().toISOString(), is_active: true, unsubscribed_at: null, confirm_token: crypto.randomUUID() })
        .eq("confirm_token", token)
        .select("id");
      return redirect(`${siteUrl()}/newsletter?status=${data?.length ? "confirmed" : "invalid"}`);
    }
    if (action === "unsubscribe") {
      const { data } = await admin
        .from("newsletter_subscribers")
        .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
        .eq("unsubscribe_token", token)
        .select("id");
      return redirect(`${siteUrl()}/newsletter?status=${data?.length ? "unsubscribed" : "invalid"}`);
    }
    return redirect(`${siteUrl()}/newsletter?status=invalid`);
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  // One-click unsubscribe from email clients (RFC 8058): POST ?action=unsubscribe&token=...
  const query = new URL(req.url).searchParams;
  if (query.get("action") === "unsubscribe") {
    const token = query.get("token") ?? "";
    if (!UUID.test(token)) return json({ error: "Invalid token" }, 400, cors);
    await admin
      .from("newsletter_subscribers")
      .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
      .eq("unsubscribe_token", token);
    return json({ status: "unsubscribed" }, 200, cors);
  }

  const body = await req.json().catch(() => null);
  if (body?.action !== "subscribe") return json({ error: "Unknown action" }, 400, cors);
  if (!emailConfigured()) return json({ error: "Email alerts are not available yet.", code: "not_configured" }, 503, cors);

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) return json({ error: "कृपया सही ईमेल डालें।", code: "invalid_email" }, 400, cors);
  if (body.consent !== true) return json({ error: "कृपया सहमति दें।", code: "consent_required" }, 400, cors);
  if (!(await verifyTurnstile(body.turnstileToken, clientIp(req)))) {
    return json({ error: "सुरक्षा जाँच असफल रही। कृपया दोबारा कोशिश करें।", code: "captcha_failed" }, 400, cors);
  }
  const categories = Array.isArray(body.categories)
    ? body.categories.filter((c: unknown) => typeof c === "string" && c.length <= 60).slice(0, 10)
    : [];

  const { data: existing } = await admin
    .from("newsletter_subscribers")
    .select("id, confirmed_at, is_active, unsubscribed_at, confirm_sent_at, unsubscribe_token")
    .eq("email", email)
    .maybeSingle();

  if (existing?.confirmed_at && existing.is_active && !existing.unsubscribed_at) {
    await admin.from("newsletter_subscribers").update({ categories }).eq("id", existing.id);
    return json({ status: "already_subscribed" }, 200, cors);
  }
  if (existing?.confirm_sent_at && Date.now() - new Date(existing.confirm_sent_at).getTime() < RESEND_COOLDOWN_MS) {
    return json({ status: "pending" }, 200, cors);
  }

  const confirmToken = crypto.randomUUID();
  const row = {
    email,
    categories,
    is_active: false,
    confirmed_at: null,
    unsubscribed_at: null,
    confirm_token: confirmToken,
    consent_text: CONSENT_TEXT,
    confirm_sent_at: new Date().toISOString(),
  };
  const { data: saved, error } = existing
    ? await admin.from("newsletter_subscribers").update(row).eq("id", existing.id).select("unsubscribe_token").single()
    : await admin.from("newsletter_subscribers").insert(row).select("unsubscribe_token").single();
  if (error || !saved) {
    console.error("newsletter save failed", error);
    return json({ error: "अभी सब्सक्राइब नहीं हो सका। कृपया बाद में कोशिश करें।" }, 500, cors);
  }

  const confirmUrl = `${functionUrl()}?action=confirm&token=${confirmToken}`;
  const unsubscribeUrl = `${functionUrl()}?action=unsubscribe&token=${saved.unsubscribe_token}`;
  const mail = confirmEmail(confirmUrl, unsubscribeUrl);
  const sent = await sendEmails([{ to: email, subject: mail.subject, html: mail.html }]);
  if (!sent) return json({ error: "पुष्टि ईमेल नहीं भेजा जा सका। कृपया बाद में कोशिश करें।" }, 502, cors);
  return json({ status: "pending" }, 200, cors);
});
