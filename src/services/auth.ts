// Authentication flows (audit S12: password reset, stronger passwords, account deletion).
import { supabase } from "@/lib/supabase";
import { safeRedirectPath } from "@/lib/url";

export const PASSWORD_MIN = 8;

export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `पासवर्ड कम से कम ${PASSWORD_MIN} अक्षरों का होना चाहिए।`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "पासवर्ड में अक्षर और अंक दोनों होने चाहिए।";
  return null;
}

/** Turns Supabase auth errors into short Hindi messages. */
export function friendlyAuthError(error: unknown): string {
  const message = ((error as { message?: string })?.message ?? "").toLowerCase();
  if (message.includes("invalid login")) return "ईमेल या पासवर्ड गलत है।";
  if (message.includes("email not confirmed")) return "कृपया पहले अपनी ईमेल की पुष्टि करें (इनबॉक्स देखें)।";
  if (message.includes("already registered") || message.includes("already been registered")) return "यह ईमेल पहले से रजिस्टर है। साइन इन करें।";
  if (message.includes("rate limit") || message.includes("too many")) return "बहुत ज़्यादा कोशिशें हुईं। कुछ देर बाद दोबारा करें।";
  if (message.includes("pwned") || message.includes("weak")) return "यह पासवर्ड असुरक्षित है। कोई दूसरा पासवर्ड चुनें।";
  if (message.includes("network") || message.includes("fetch")) return "इंटरनेट कनेक्शन जाँचें और दोबारा कोशिश करें।";
  return "कुछ गलत हो गया। कृपया दोबारा कोशिश करें।";
}

export async function signUp(email: string, password: string, fullName: string, redirectPath = "/") {
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}${safeRedirectPath(redirectPath)}`,
      data: fullName.trim() ? { full_name: fullName.trim() } : {},
    },
  });
  if (error) throw error;
  return data;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle(redirectPath = "/") {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}${safeRedirectPath(redirectPath)}` },
  });
  if (error) throw error;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/auth/reset`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

/** Permanently deletes the signed-in reader's account through the delete-account edge function. */
export async function deleteAccount() {
  const { data, error } = await supabase.functions.invoke<{ status?: string; error?: string }>("delete-account", {
    body: { confirm: "DELETE" },
  });
  if (error) {
    const context = (error as { context?: Response }).context;
    const body = context ? await context.json().catch(() => null) : null;
    throw new Error(body?.error ?? "खाता हटाया नहीं जा सका।");
  }
  if (data?.status !== "deleted") throw new Error(data?.error ?? "खाता हटाया नहीं जा सका।");
  await supabase.auth.signOut({ scope: "local" });
}
