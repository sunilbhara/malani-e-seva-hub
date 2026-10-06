// Push endpoints are supplied by browsers (and therefore by anyone calling the public RPC), so
// only real Web Push services are ever contacted. Keep in sync with the
// push_subscriptions_endpoint_host check in supabase/migrations.
const EXACT_HOSTS = new Set(["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"]);
const SUFFIX_HOSTS = [".notify.windows.com", ".push.apple.com"];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  return EXACT_HOSTS.has(host) || SUFFIX_HOSTS.some((s) => host.endsWith(s) && host.length > s.length);
}
