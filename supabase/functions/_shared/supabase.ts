import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

/** Service-role client: bypasses RLS. Use only after checking who is calling. */
export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Client that acts as the caller (their JWT), so RLS applies. */
export function callerClient(req: Request): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getCaller(req: Request): Promise<{ user: User | null; isAdmin: boolean; client: SupabaseClient }> {
  const client = callerClient(req);
  if (!req.headers.get("Authorization")) return { user: null, isAdmin: false, client };
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { user: null, isAdmin: false, client };
  const { data: isAdmin } = await client.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
  return { user: data.user, isAdmin: isAdmin === true, client };
}
