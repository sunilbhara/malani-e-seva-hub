// Schema.org JSON-LD builders. Business details come from the shared BUSINESS constant (audit B12).
import { BUSINESS, openingHoursSpecification } from "@/lib/business";
import { qualificationLabel } from "@/lib/jobs";
import type { FaqItem } from "@/i18n/types";

export const SITE_URL = BUSINESS.siteUrl;

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildFaqSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function buildLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#business`,
    name: BUSINESS.name,
    alternateName: BUSINESS.nameHi,
    url: SITE_URL,
    telephone: BUSINESS.phone,
    image: BUSINESS.defaultImage,
    logo: `${SITE_URL}/icons/icon-512.png`,
    priceRange: "₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address.street,
      addressLocality: BUSINESS.address.city,
      addressRegion: BUSINESS.address.region,
      postalCode: BUSINESS.address.postalCode,
      addressCountry: BUSINESS.address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: BUSINESS.geo.latitude, longitude: BUSINESS.geo.longitude },
    openingHoursSpecification: openingHoursSpecification(),
    founder: { "@type": "Person", name: BUSINESS.owner },
    sameAs: [BUSINESS.social.instagram, BUSINESS.social.youtube],
  };
}

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "मालाणी बाड़मेर",
    url: SITE_URL,
    inLanguage: "hi-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/jobs?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export interface ArticleSchemaInput {
  title: string;
  description: string;
  slug: string;
  image?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  authorName?: string | null;
}

export function buildArticleSchema(a: ArticleSchemaInput) {
  const url = absoluteUrl(`/blog/${a.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: a.title.slice(0, 110),
    description: a.description,
    image: a.image ? [a.image] : [BUSINESS.defaultImage],
    datePublished: a.publishedAt ?? undefined,
    dateModified: a.updatedAt ?? a.publishedAt ?? undefined,
    inLanguage: "hi-IN",
    author: { "@type": "Organization", name: a.authorName || BUSINESS.name, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: BUSINESS.name,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icons/icon-512.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export interface JobPostingInput {
  title: string;
  descriptionHtml: string;
  slug: string;
  organisation: string;
  publishedAt: string;
  lastDate: string;
  totalPosts?: number | null;
  qualifications?: string[];
  state?: string | null;
  officialWebsite?: string | null;
}

/** Google for Jobs structured data (audit G2). Only for open recruitments with a last date. */
export function buildJobPostingSchema(j: JobPostingInput) {
  const education = (j.qualifications ?? []).filter((q) => q !== "any").map(qualificationLabel).join(", ");
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: j.title.slice(0, 110),
    description: j.descriptionHtml,
    datePosted: j.publishedAt,
    validThrough: `${j.lastDate}T23:59:59+05:30`,
    employmentType: "FULL_TIME",
    directApply: false,
    totalJobOpenings: j.totalPosts ?? undefined,
    educationRequirements: education || undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: j.organisation,
      sameAs: j.officialWebsite ?? undefined,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressRegion: j.state === "rajasthan" || !j.state ? "Rajasthan" : undefined,
        addressCountry: "IN",
      },
    },
    url: absoluteUrl(`/blog/${j.slug}`),
  };
}
