// Run: npx deno test netlify/tests
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { blogIdentifier, buildSitemap, rewriteHead, socialImage } from "../shared/seo.ts";

const TEMPLATE = `<!doctype html><html><head>
<title>Malani Barmer</title>
<meta name="description" content="Generic site description" />
<meta property="og:title" content="Generic" />
<meta property="og:description" content="Generic" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://malanibarmer.com" />
<meta property="og:image" content="https://img/default.jpg" />
<meta name="twitter:title" content="Generic" />
<meta name="twitter:description" content="Generic" />
<meta name="twitter:image" content="https://img/default.jpg" />
<link rel="icon" href="/favicon.ico" />
</head><body><div id="root"></div></body></html>`;

Deno.test("rewriteHead replaces generic tags with the post's tags exactly once", () => {
  const out = rewriteHead(TEMPLATE, {
    title: `RSMSSB पटवारी भर्ती "2026" <b>`,
    description: "2,020 पद, अंतिम तिथि 25 Oct",
    url: "https://malanibarmer.com/blog/rsmssb-patwari",
    image: "https://img/post.jpg",
    type: "article",
    publishedAt: "2026-10-05T10:00:00Z",
  });
  assertEquals(out.match(/<title>/g)?.length, 1);
  assertEquals(out.match(/property="og:title"/g)?.length, 1);
  assertEquals(out.match(/name="twitter:image"/g)?.length, 1);
  assertStringIncludes(out, `<title>RSMSSB पटवारी भर्ती &quot;2026&quot; &lt;b&gt;</title>`);
  assertStringIncludes(out, `<meta property="og:image" content="https://img/post.jpg" data-rh="true" />`);
  assertStringIncludes(out, `<meta property="og:type" content="article" data-rh="true" />`);
  assertStringIncludes(out, `<link rel="canonical" href="https://malanibarmer.com/blog/rsmssb-patwari" data-rh="true" />`);
  assertStringIncludes(out, `<meta property="article:published_time" content="2026-10-05T10:00:00Z" data-rh="true" />`);
  assert(!out.includes("Generic"), "all generic tags removed");
  assertStringIncludes(out, `<link rel="icon" href="/favicon.ico" />`, "unrelated tags kept");
  assertStringIncludes(out, `<div id="root"></div>`, "body untouched");
});

Deno.test("rewriteHead leaves non-HTML untouched", () => {
  assertEquals(rewriteHead("plain", { title: "t", description: "d", url: "u", image: "i", type: "article" }), "plain");
});

Deno.test("socialImage crops Cloudinary images to 1200x630", () => {
  assertEquals(
    socialImage("https://res.cloudinary.com/duovfafmc/image/upload/v1757/malani-blog/x.jpg", "d"),
    "https://res.cloudinary.com/duovfafmc/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/v1757/malani-blog/x.jpg",
  );
  assertEquals(
    socialImage("https://res.cloudinary.com/duovfafmc/image/upload/f_auto,q_auto:good,w_1400,c_limit/v1/x.png", "d"),
    "https://res.cloudinary.com/duovfafmc/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/v1/x.png",
  );
  assertEquals(socialImage("https://other.example/x.jpg", "d"), "https://other.example/x.jpg");
  assertEquals(socialImage(null, "d"), "d");
});

Deno.test("blogIdentifier parses slugs and ids, rejects nested paths", () => {
  assertEquals(blogIdentifier("/blog/rajasthan-police-2026"), { column: "slug", value: "rajasthan-police-2026" });
  assertEquals(blogIdentifier("/blog/bbbbbbbb-0000-4000-8000-000000000001"), { column: "id", value: "bbbbbbbb-0000-4000-8000-000000000001" });
  assertEquals(blogIdentifier("/blog"), null);
  assertEquals(blogIdentifier("/blog/a/b"), null);
  assertEquals(blogIdentifier("/blog/%E0%A4"), null, "malformed encoding");
});

Deno.test("buildSitemap escapes and formats entries", () => {
  const xml = buildSitemap([
    { loc: "https://malanibarmer.com/blog/a&b", lastmod: "2026-10-05T10:00:00Z", changefreq: "weekly", priority: 0.7 },
  ]);
  assertStringIncludes(xml, "<loc>https://malanibarmer.com/blog/a&amp;b</loc>");
  assertStringIncludes(xml, "<lastmod>2026-10-05</lastmod>");
  assertStringIncludes(xml, "<priority>0.7</priority>");
  assert(xml.startsWith(`<?xml version="1.0" encoding="UTF-8"?>`));
});

Deno.test("rewritten tags are marked for react-helmet so the client replaces, not duplicates, them", () => {
  const out = rewriteHead(TEMPLATE, { title: "t", description: "d", url: "https://malanibarmer.com/blog/x", image: "https://img/x.jpg", type: "article" });
  const managed = out.match(/<(meta|link)\s[^>]*(og:|twitter:|canonical|name="description")[^>]*>/g) ?? [];
  assertEquals(managed.length > 0, true);
  for (const tag of managed) assertStringIncludes(tag, 'data-rh="true"');
});
