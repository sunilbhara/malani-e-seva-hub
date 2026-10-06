// Web push subscription (Blueprint Loop 1). The service worker shows notifications (see src/sw.ts).
import { supabase } from "@/lib/supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    Boolean(VAPID_PUBLIC_KEY)
  );
}

export function pushPermission(): NotificationPermission | "unsupported" {
  return pushSupported() ? Notification.permission : "unsupported";
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** Asks for permission (only call after a user action) and registers the subscription. */
export async function subscribeToPush(topics: string[]): Promise<PushSubscription> {
  if (!pushSupported()) throw new Error("इस ब्राउज़र में नोटिफ़िकेशन उपलब्ध नहीं हैं।");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("नोटिफ़िकेशन की अनुमति नहीं मिली।");
  const reg = await navigator.serviceWorker.ready;
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!) }));
  const json = subscription.toJSON();
  const { error } = await supabase.rpc("upsert_push_subscription", {
    p_endpoint: subscription.endpoint,
    p_p256dh: json.keys?.p256dh ?? "",
    p_auth: json.keys?.auth ?? "",
    p_topics: topics,
  });
  if (error) throw error;
  return subscription;
}

/** Updates topics for an existing subscription (e.g. after preferences change). */
export async function updatePushTopics(topics: string[]): Promise<void> {
  const subscription = await currentSubscription();
  if (!subscription) return;
  const json = subscription.toJSON();
  await supabase.rpc("upsert_push_subscription", {
    p_endpoint: subscription.endpoint,
    p_p256dh: json.keys?.p256dh ?? "",
    p_auth: json.keys?.auth ?? "",
    p_topics: topics,
  });
}

export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await currentSubscription();
  if (!subscription) return;
  await supabase.rpc("delete_push_subscription", { p_endpoint: subscription.endpoint });
  await subscription.unsubscribe();
}
