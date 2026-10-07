// Writes a static fallback public/sitemap.xml. Production serves the live sitemap from the
// Netlify edge function (netlify/edge-functions/sitemap.ts); run this only for local checks.
// Uses the publishable (anon) key: RLS already exposes published posts to everyone.
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SITE_URL = (process.env.VITE_SITE_URL || "https://malanibarmer.com").replace(/\/$/, "");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("[sitemap] Skipped: VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY not set.");
  process.exit(0);
}

const { routes } = JSON.parse(fs.readFileSync(path.resolve("config/public-routes.json"), "utf8"));
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function run() {
  const posts = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .not("slug", "is", null)
      .order("published_at", { ascending: false })
      .range(from, from + 999);
    if (error) throw error;
    posts.push(...data);
    if (data.length < 1000) break;
  }
  const today = new Date().toISOString().slice(0, 10);
  const items = [
    ...routes.map((r) => ({ loc: `${SITE_URL}${r.path}`, lastmod: today, changefreq: r.changefreq, priority: r.priority })),
    ...posts.map((p) => ({ loc: `${SITE_URL}/blog/${encodeURIComponent(p.slug)}`, lastmod: (p.updated_at || p.published_at || "").slice(0, 10) })),
  ];
  const body = items
    .map((i) => {
      const extra = (i.changefreq ? `\n    <changefreq>${i.changefreq}</changefreq>` : "") + (i.priority != null ? `\n    <priority>${i.priority.toFixed(1)}</priority>` : "");
      return `  <url>\n    <loc>${escape(i.loc)}</loc>\n    <lastmod>${i.lastmod}</lastmod>${extra}\n  </url>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  const out = path.resolve("public", "sitemap.xml");
  fs.writeFileSync(out, xml, "utf8");
  console.log(`[sitemap] Wrote ${items.length} URLs to ${out}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
