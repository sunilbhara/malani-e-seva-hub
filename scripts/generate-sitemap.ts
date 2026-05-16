/**
 * Dynamic sitemap generator.
 * Runs before `vite dev` and `vite build` (predev/prebuild) and writes
 * `public/sitemap.xml` with static routes + every published blog post
 * fetched from Supabase.
 */
import 'dotenv/config'
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://malanibarmer.com";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://plizeqndbyscfyboalcd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "Pj8_q-hI1_qaEI2c26xm8";

interface Entry {
  path: string;
  lastmod?: string;
  changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: string;
}

const staticEntries: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/blog", changefreq: "daily", priority: "0.9" },
  { path: "/services", changefreq: "weekly", priority: "0.9" },
  { path: "/mobile-electronics", changefreq: "weekly", priority: "0.9" },
  { path: "/mataji-studio", changefreq: "weekly", priority: "0.9" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

async function fetchPostEntries(): Promise<Entry[]> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase
      .from("posts")
      .select("slug, updated_at, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((p) => ({
      path: `/blog/${p.slug}`,
      lastmod: (p.updated_at || p.created_at)?.slice(0, 10),
      changefreq: "daily",
      priority: "0.8",
    }));
  } catch (e) {
    console.warn("[sitemap] Could not fetch posts:", (e as Error).message);
    return [];
  }
}

function render(entries: Entry[]) {
  const urls = entries
    .map((e) =>
      [
        "  <url>",
        `    <loc>${BASE_URL}${e.path}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function main() {
  const posts = await fetchPostEntries();
  const all = [...staticEntries, ...posts];
  writeFileSync(resolve("public/sitemap.xml"), render(all));
  console.log(`[sitemap] wrote ${all.length} entries (${posts.length} blog posts)`);
}

void main();
