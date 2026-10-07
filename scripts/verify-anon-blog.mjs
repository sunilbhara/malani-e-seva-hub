// Checks what an anonymous visitor can read: published posts yes; drafts, emails and roles no.
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !anonKey) {
  console.error("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  process.exit(1);
}
const anon = createClient(url, anonKey, { auth: { persistSession: false } });
let failed = 0;
const check = (label, ok, detail) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` (${detail})` : ""}`);
  if (!ok) failed += 1;
};

const published = await anon.from("posts").select("id, status").eq("status", "published").limit(5);
check("anon reads published posts", !published.error, published.error?.message ?? `${published.data.length} rows`);

const drafts = await anon.from("posts").select("id").neq("status", "published").limit(1);
check("anon cannot see drafts", !drafts.error && drafts.data.length === 0, drafts.error?.message);

const emails = await anon.from("profiles").select("email").limit(1);
check("anon cannot read profile emails", Boolean(emails.error) || emails.data.length === 0, emails.error?.message);

const roles = await anon.from("user_roles").select("role").limit(1);
check("anon cannot read user roles", Boolean(roles.error) || roles.data.length === 0, roles.error?.message);

const subs = await anon.from("newsletter_subscribers").select("email").limit(1);
check("anon cannot read newsletter subscribers", Boolean(subs.error) || subs.data.length === 0, subs.error?.message);

const list = await anon.rpc("list_posts", { p_limit: 3 });
check("anon can call list_posts", !list.error, list.error?.message ?? `${list.data?.length ?? 0} rows`);

process.exit(failed ? 1 : 0);
