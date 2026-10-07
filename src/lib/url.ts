/** Returns the URL only if it is an absolute http(s) URL (audit S14: no javascript: links). */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Same-origin path for redirects after login (prevents open redirects). */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

export function loginUrl(returnPath: string, action?: "login" | "signup"): string {
  const params = new URLSearchParams({ redirect: returnPath });
  if (action) params.set("action", action);
  return `/login?${params.toString()}`;
}
