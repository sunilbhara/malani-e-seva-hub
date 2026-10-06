// Web Push (VAPID) sending, with cleanup of dead subscriptions.
import webpush from "npm:web-push@3.6.7";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { isAllowedPushEndpoint } from "./pushHosts.ts";

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

let configured: boolean | null = null;

export function pushConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = Deno.env.get("VAPID_PUBLIC_KEY");
  const priv = Deno.env.get("VAPID_PRIVATE_KEY");
  const subject = Deno.env.get("VAPID_SUBJECT") ?? "https://malanibarmer.com";
  configured = Boolean(pub && priv);
  if (configured) webpush.setVapidDetails(subject, pub!, priv!);
  return configured;
}

/** Sends to every target; removes subscriptions the push service says are gone. Returns sent count. */
export async function sendPush(admin: SupabaseClient, targets: PushTarget[], payload: PushPayload): Promise<number> {
  if (!pushConfigured() || targets.length === 0) return 0;
  const body = JSON.stringify(payload);
  let sent = 0;
  // Never contact hosts other than real push services (SSRF guard); drop such rows.
  const gone: string[] = targets.filter((t) => !isAllowedPushEndpoint(t.endpoint)).map((t) => t.endpoint);
  targets = targets.filter((t) => isAllowedPushEndpoint(t.endpoint));
  const failed: string[] = [];

  for (let i = 0; i < targets.length; i += 50) {
    const batch = targets.slice(i, i + 50);
    const results = await Promise.allSettled(
      batch.map((t) =>
        webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, body, {
          TTL: 60 * 60 * 24,
          urgency: "normal",
        }),
      ),
    );
    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        sent += 1;
        return;
      }
      const status = (result.reason as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) gone.push(batch[idx].endpoint);
      else failed.push(batch[idx].endpoint);
    });
  }

  if (gone.length) await admin.from("push_subscriptions").delete().in("endpoint", gone);
  if (failed.length) {
    const { data } = await admin.from("push_subscriptions").select("endpoint, failure_count").in("endpoint", failed);
    for (const row of data ?? []) {
      if (row.failure_count >= 5) await admin.from("push_subscriptions").delete().eq("endpoint", row.endpoint);
      else await admin.from("push_subscriptions").update({ failure_count: row.failure_count + 1 }).eq("endpoint", row.endpoint);
    }
  }
  return sent;
}
