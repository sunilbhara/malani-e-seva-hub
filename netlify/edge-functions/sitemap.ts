// Audit G3: a live sitemap, so new posts are discoverable immediately instead of after a redeploy.
import type { Config } from "https://edge.netlify.com";
import routes from "../../config/public-routes.json" with { type: "json" };
import { buildSitemap, type SitemapEntry } from "../shared/seo.ts";

const SITE = "https://malanibarmer.com";

export default async () => {
  const today = new Date().toISOString().slice(0, 10);
  const entries: SitemapEntry[] = routes.routes.map((r) => ({
    loc: `${SITE}${r.path}`,
    lastmod: today,
    changefreq: r.changefreq,
    priority: r.priority,
  }));

  const base = Netlify.env.get("VITE_SUPABASE_URL");
  const key = Netlify.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (base && key) {
    try {
      const res = await fetch(
        `${base}/rest/v1/posts?select=slug,updated_at,published_at&status=eq.published&order=published_at.desc&limit=5000`,
        {
          headers: { apikey: key, Authorization: key.startsWith("eyJ") ? `Bearer ${key}` : "" },
          signal: AbortSignal.timeout(3000),
        },
      );
      if (res.ok) {
        const posts = (await res.json()) as Array<{ slug: string | null; updated_at: string | null; published_at: string | null }>;
        for (const p of posts) {
          if (!p.slug) continue;
          entries.push({ loc: `${SITE}/blog/${encodeURIComponent(p.slug)}`, lastmod: p.updated_at ?? p.published_at, changefreq: "weekly", priority: 0.7 });
        }
      }
    } catch {
      // Fall through with static routes only.
    }
  }

  return new Response(buildSitemap(entries), {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=900, s-maxage=900",
    },
  });
};

export const config: Config = { path: "/sitemap.xml", cache: "manual" };
