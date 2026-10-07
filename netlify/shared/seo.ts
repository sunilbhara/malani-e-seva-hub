// Pure helpers for the Netlify edge functions (no Netlify or Deno APIs), so they can be unit tested.

export interface PageMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  type: "article" | "website";
  publishedAt?: string | null;
  modifiedAt?: string | null;
}

export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const REPLACED_META = [
  /<title>[\s\S]*?<\/title>/gi,
  /<meta\s+name="description"[^>]*>/gi,
  /<meta\s+property="og:(title|description|image|url|type)"[^>]*>/gi,
  /<meta\s+property="article:(published_time|modified_time)"[^>]*>/gi,
  /<meta\s+name="twitter:(title|description|image)"[^>]*>/gi,
  /<link\s+rel="canonical"[^>]*>/gi,
];

/** Replaces the page's title/description/Open Graph/Twitter/canonical tags with post-specific ones. */
export function rewriteHead(html: string, meta: PageMeta): string {
  if (!html.includes("</head>")) return html;
  let out = html;
  for (const pattern of REPLACED_META) out = out.replace(pattern, "");
  const t = escapeAttr(meta.title);
  const d = escapeAttr(meta.description);
  const tags = [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" data-rh="true" />`,
    `<link rel="canonical" href="${escapeAttr(meta.url)}" data-rh="true" />`,
    `<meta property="og:type" content="${meta.type}" data-rh="true" />`,
    `<meta property="og:title" content="${t}" data-rh="true" />`,
    `<meta property="og:description" content="${d}" data-rh="true" />`,
    `<meta property="og:url" content="${escapeAttr(meta.url)}" data-rh="true" />`,
    `<meta property="og:image" content="${escapeAttr(meta.image)}" data-rh="true" />`,
    `<meta name="twitter:title" content="${t}" data-rh="true" />`,
    `<meta name="twitter:description" content="${d}" data-rh="true" />`,
    `<meta name="twitter:image" content="${escapeAttr(meta.image)}" data-rh="true" />`,
    meta.publishedAt ? `<meta property="article:published_time" content="${escapeAttr(meta.publishedAt)}" data-rh="true" />` : "",
    meta.modifiedAt ? `<meta property="article:modified_time" content="${escapeAttr(meta.modifiedAt)}" data-rh="true" />` : "",
  ].filter(Boolean);
  return out.replace("</head>", `    ${tags.join("\n    ")}\n  </head>`);
}

/** Cloudinary images get a 1200x630 crop so WhatsApp/Facebook show a large preview. */
export function socialImage(url: string | null | undefined, fallback: string): string {
  if (!url) return fallback;
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace(/\/upload\/(?:[^/]*,[^/]*\/|[a-z]_[^/]*\/)?/, "/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/");
  }
  return url;
}

export interface SitemapEntry {
  loc: string;
  lastmod?: string | null;
  changefreq?: string;
  priority?: number;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSitemap(entries: SitemapEntry[]): string {
  const urls = entries.map((e) => {
    const parts = [`    <loc>${escapeXml(e.loc)}</loc>`];
    if (e.lastmod) parts.push(`    <lastmod>${escapeXml(e.lastmod.slice(0, 10))}</lastmod>`);
    if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
    if (typeof e.priority === "number") parts.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
    return `  <url>\n${parts.join("\n")}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Extracts the post identifier from /blog/:identifier (ignores deeper paths). */
export function blogIdentifier(pathname: string): { column: "id" | "slug"; value: string } | null {
  const match = /^\/blog\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  let value: string;
  try {
    value = decodeURIComponent(match[1]);
  } catch {
    return null;
  }
  if (!value || value.length > 300) return null;
  return { column: UUID.test(value) ? "id" : "slug", value };
}
