import { Helmet } from "react-helmet-async";
import { useI18n } from "@/i18n";
import { BUSINESS } from "@/lib/business";
import { absoluteUrl } from "@/lib/seo";

export interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
  noindex?: boolean;
  publishedAt?: string | null;
  updatedAt?: string | null;
  author?: string | null;
  /** Content language; blog and job pages are Hindi (audit G5). Defaults to the UI language. */
  lang?: "hi" | "en";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function SEO({
  title,
  description,
  path = "/",
  image,
  type = "website",
  noindex = false,
  publishedAt,
  updatedAt,
  author,
  lang,
  jsonLd,
}: SEOProps) {
  const { messages } = useI18n();
  const url = absoluteUrl(path);
  const htmlLang = lang ?? (messages.locale.startsWith("hi") ? "hi" : "en");
  const ogLocale = htmlLang === "hi" ? "hi_IN" : "en_IN";
  const ogImage = image || BUSINESS.defaultImage;
  const schemas = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  const desc = description.length > 200 ? `${description.slice(0, 197)}…` : description;

  return (
    <Helmet>
      <html lang={htmlLang} />
      <title>{title}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"}
      />
      <meta property="og:site_name" content="मालाणी बाड़मेर" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={ogLocale} />
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      {updatedAt && <meta property="article:modified_time" content={updatedAt} />}
      {author && type === "article" && <meta property="article:author" content={author} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
