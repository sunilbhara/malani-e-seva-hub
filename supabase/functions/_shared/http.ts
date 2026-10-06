// HTTP helpers shared by all edge functions.

const DEFAULT_ORIGINS = [
  "https://malanibarmer.com",
  "https://www.malanibarmer.com",
  "http://localhost:8080",
];

export function allowedOrigins(): string[] {
  const fromEnv = Deno.env.get("ALLOWED_ORIGINS");
  return fromEnv ? fromEnv.split(",").map((o) => o.trim()).filter(Boolean) : DEFAULT_ORIGINS;
}

/** CORS headers that only echo back an allowed origin. */
export function corsHeadersFor(req: Request, origins = allowedOrigins()): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allow = origins.includes(origin) ? origin : origins[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });
}

export function redirect(location: string): Response {
  return new Response(null, { status: 302, headers: { Location: location } });
}

export function siteUrl(): string {
  return (Deno.env.get("SITE_URL") ?? "https://malanibarmer.com").replace(/\/+$/, "");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}
