import { escapeHtml } from "../_shared/http.ts";

export interface PublishedPost {
  id: string;
  title: string;
  slug: string;
  post_type: string | null;
  seo_description: string | null;
  excerpt: string | null;
  job?: {
    organisation: string | null;
    total_posts: number | null;
    last_date: string | null;
    qualifications: string[] | null;
    departments: string[] | null;
  } | null;
}

const TYPE_EMOJI: Record<string, string> = {
  job: "🆕 नई भर्ती",
  admit_card: "🎫 एडमिट कार्ड",
  result: "🏆 रिजल्ट",
  exam: "📅 परीक्षा",
  local_news: "📢 बाड़मेर अपडेट",
  guide: "📘 जानकारी",
  article: "📰 अपडेट",
};

export function formatDateHi(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];
  return `${d} ${months[m - 1]} ${y}`;
}

export function postUrl(siteUrl: string, slug: string, source: string): string {
  return `${siteUrl}/blog/${encodeURIComponent(slug)}?utm_source=${source}&utm_medium=social&utm_campaign=new_post`;
}

/** Telegram HTML message (parse_mode=HTML). */
export function telegramMessage(post: PublishedPost, siteUrl: string): string {
  const label = TYPE_EMOJI[post.post_type ?? "article"] ?? TYPE_EMOJI.article;
  const lines = [`<b>${label}</b>`, `<b>${escapeHtml(post.title)}</b>`];
  if (post.job?.organisation) lines.push(`🏛 ${escapeHtml(post.job.organisation)}`);
  if (post.job?.total_posts) lines.push(`👥 कुल पद: ${post.job.total_posts.toLocaleString("en-IN")}`);
  if (post.job?.last_date) lines.push(`⏰ अंतिम तिथि: ${formatDateHi(post.job.last_date)}`);
  const summary = post.seo_description || post.excerpt;
  if (summary) lines.push("", escapeHtml(summary.slice(0, 200)));
  lines.push("", `👉 पूरी जानकारी: ${postUrl(siteUrl, post.slug, "telegram")}`);
  lines.push("📍 फॉर्म भरवाने के लिए: मालाणी ई-मित्र, बाड़मेर");
  return lines.join("\n");
}

export function pushPayload(post: PublishedPost, siteUrl: string) {
  const facts = [
    post.job?.total_posts ? `${post.job.total_posts.toLocaleString("en-IN")} पद` : null,
    post.job?.last_date ? `अंतिम तिथि ${formatDateHi(post.job.last_date)}` : null,
  ].filter(Boolean).join(" · ");
  return {
    title: post.title.slice(0, 120),
    body: facts || (post.seo_description ?? post.excerpt ?? "नई अपडेट पढ़ें").slice(0, 140),
    url: postUrl(siteUrl, post.slug, "push"),
    tag: `post-${post.id}`,
  };
}

/** Push topics a post matches: always "all", plus its qualifications and departments. */
export function postTopics(post: PublishedPost): string[] {
  return ["all", ...(post.job?.qualifications ?? []), ...(post.job?.departments ?? [])];
}
