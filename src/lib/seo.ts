import type { FaqItem } from "@/i18n/types";

export const SITE_URL = "https://malanibarmer.com";

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path}`;
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
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Malani Barmer",
    url: SITE_URL,
    telephone: "+91 9950788973",
    image: "https://res.cloudinary.com/duovfafmc/image/upload/v1757222789/0022_jfozz9.jpg",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Near IDBI Bank Opp. Railway Station, High School Road",
      addressLocality: "Barmer",
      addressRegion: "Rajasthan",
      postalCode: "344001",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 25.746793418531855,
      longitude: 71.39670954386371,
    },
    sameAs: [
      "https://www.instagram.com/malani_mobile_barmer/",
      "https://www.youtube.com/@MalaniMobileandElectronices",
    ],
  };
}
