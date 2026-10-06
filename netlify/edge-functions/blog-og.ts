// Audit G1: link-preview bots (WhatsApp, Facebook, Telegram, X) do not run JavaScript, so the SPA's
// per-post meta tags are invisible to them. This edge function rewrites the <head> of /blog/:slug
// with the post's real title, description and image before the HTML leaves the CDN.
import type { Config, Context } from "https://edge.netlify.com";
import { blogIdentifier, rewriteHead, socialImage } from "../shared/seo.ts";

const SITE = "https://malanibarmer.com";
const DEFAULT_IMAGE = "https://res.cloudinary.com/duovfafmc/image/upload/v1757222789/0022_jfozz9.jpg";

interface PostRow {
  title: string;
  slug: string;
  seo_title: string | null;
  seo_description: string | null;
  excerpt: string | null;
  og_image_url: string | null;
  image_url: string | null;
  published_at: string | null;
  updated_at: string | null;
}

async function fetchPost(column: "id" | "slug", value: string): Promise<PostRow | null> {
  const base = Netlify.env.get("VITE_SUPABASE_URL");
  const key = Netlify.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!base || !key) return null;
  const url =
    `${base}/rest/v1/posts?${column}=eq.${encodeURIComponent(value)}` +
    "&select=title,slug,seo_title,seo_description,excerpt,og_image_url,image_url,published_at,updated_at&limit=1";
  try {
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: key.startsWith("eyJ") ? `Bearer ${key}` : "" },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as PostRow[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export default async (request: Request, context: Context) => {
  const response = await context.next();
  const id = blogIdentifier(new URL(request.url).pathname);
  if (!id || !(response.headers.get("content-type") ?? "").includes("text/html")) return response;

  const post = await fetchPost(id.column, id.value);
  if (!post) return response;

  const html = await response.text();
  const rewritten = rewriteHead(html, {
    title: post.seo_title || `${post.title} | मालाणी बाड़मेर`,
    description: (post.seo_description || post.excerpt || "").slice(0, 200),
    url: `${SITE}/blog/${encodeURIComponent(post.slug)}`,
    image: socialImage(post.og_image_url || post.image_url, DEFAULT_IMAGE),
    type: "article",
    publishedAt: post.published_at,
    modifiedAt: post.updated_at,
  });
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "public, max-age=0, must-revalidate");
  return new Response(rewritten, { status: response.status, headers });
};

export const config: Config = { path: "/blog/*", cache: "manual" };
