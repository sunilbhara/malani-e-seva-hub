// Guard for edge functions that only the database (triggers, pg_cron) may call.
// public.call_edge_function sends app_settings.internal_function_token as `x-internal-token`;
// app_settings is unreadable for anon/authenticated, so outsiders cannot obtain it.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

let cached: { token: string; at: number } | null = null;

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length || ea.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i += 1) diff |= ea[i] ^ eb[i];
  return diff === 0;
}

async function expectedToken(admin: SupabaseClient): Promise<string | null> {
  if (cached && Date.now() - cached.at < 5 * 60_000) return cached.token;
  const { data } = await admin.from("app_settings").select("value").eq("key", "internal_function_token").maybeSingle();
  const token = (data as { value?: string } | null)?.value ?? null;
  if (token) cached = { token, at: Date.now() };
  return token;
}

/** True only for calls made by the database with the shared internal token. */
export async function isInternalCall(req: Request, admin: SupabaseClient): Promise<boolean> {
  const presented = req.headers.get("x-internal-token") ?? "";
  if (!presented) return false;
  const expected = await expectedToken(admin);
  return expected !== null && safeEqual(presented, expected);
}
