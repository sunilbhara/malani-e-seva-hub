import { supabase } from "@/lib/supabase";
import type { ReaderPreferences } from "@/lib/preferences";

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("id, full_name, avatar_url").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateDisplayName(userId: string, fullName: string) {
  const name = fullName.trim().slice(0, 80);
  if (!name) throw new Error("नाम खाली नहीं हो सकता।");
  if (name.includes("@")) throw new Error("नाम में ईमेल न लिखें।");
  const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", userId);
  if (error) throw error;
}

export async function getUserRole(userId: string): Promise<"admin" | "user" | null> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error || !data?.length) return null;
  return data.some((r) => r.role === "admin") ? "admin" : "user";
}

export async function loadRemotePreferences(userId: string): Promise<Partial<ReaderPreferences> | null> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("qualification, departments, district")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveRemotePreferences(userId: string, prefs: Pick<ReaderPreferences, "qualification" | "departments" | "district">) {
  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      qualification: prefs.qualification,
      departments: prefs.departments,
      district: prefs.district,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
