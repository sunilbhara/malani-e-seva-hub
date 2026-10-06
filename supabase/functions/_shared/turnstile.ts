// Cloudflare Turnstile verification. When TURNSTILE_SECRET_KEY is not set, verification is skipped
// (callers should then apply their own throttling).

export function turnstileConfigured(): boolean {
  return Boolean(Deno.env.get("TURNSTILE_SECRET_KEY"));
}

export async function verifyTurnstile(token: unknown, ip: string | null): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return true;
  if (typeof token !== "string" || token.length < 10 || token.length > 4096) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  return data?.success === true;
}

export function clientIp(req: Request): string | null {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}
