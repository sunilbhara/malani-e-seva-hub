// Lets a signed-in reader permanently delete their account and personal data (audit S12, DPDP Act).
// Profiles, comments, likes, bookmarks, reminders, follows, preferences and push subscriptions
// are removed by ON DELETE CASCADE from auth.users.
import { corsHeadersFor, json } from "../_shared/http.ts";
import { adminClient, getCaller } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  const { user, isAdmin } = await getCaller(req);
  if (!user) return json({ error: "Please sign in." }, 401, cors);
  if (isAdmin) {
    // Deleting an admin would cascade-delete every post they authored.
    return json({ error: "Admin accounts cannot be deleted from the website. Remove the admin role first." }, 403, cors);
  }

  const body = await req.json().catch(() => null);
  if (body?.confirm !== "DELETE") return json({ error: "Confirmation missing." }, 400, cors);

  const admin = adminClient();
  if (user.email) {
    await admin.from("newsletter_subscribers").delete().eq("email", user.email.toLowerCase());
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("delete-account failed", error);
    return json({ error: "Could not delete the account. Please try again." }, 500, cors);
  }
  return json({ status: "deleted" }, 200, cors);
});
