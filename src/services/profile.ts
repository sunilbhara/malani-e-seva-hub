import { supabase } from "@/lib/supabase";

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getUserRole(userId: string): Promise<"admin" | "user" | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) return null;
  if (!data || data.length === 0) return null;
  if (data.some((r) => r.role === "admin")) return "admin";
  return "user";
}
