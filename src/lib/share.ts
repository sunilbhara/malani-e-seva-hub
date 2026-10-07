// WhatsApp-first sharing with a pre-filled Hindi message (Blueprint Loop 5).
import { BUSINESS } from "@/lib/business";
import { formatDate, formatNumber } from "@/lib/format";

export interface ShareablePost {
  title: string;
  slug: string;
  totalPosts?: number | null;
  lastDate?: string | null;
}

export function postUrl(slug: string, source?: string): string {
  const url = `${BUSINESS.siteUrl}/blog/${encodeURIComponent(slug)}`;
  return source ? `${url}?utm_source=${source}&utm_medium=share` : url;
}

export function shareText(post: ShareablePost): string {
  const facts = [
    post.totalPosts ? `${formatNumber(post.totalPosts)} पद` : null,
    post.lastDate ? `अंतिम तिथि ${formatDate(post.lastDate)}` : null,
  ].filter(Boolean);
  const head = `🚨 ${post.title}`;
  return [head, facts.length ? facts.join(", ") : null, `पूरी जानकारी: ${postUrl(post.slug, "whatsapp")}`]
    .filter(Boolean)
    .join("\n");
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Message pre-filled when a reader asks the shop to fill a form (Blueprint Loop 7). */
export function formHelpMessage(title?: string): string {
  return title
    ? `नमस्ते, मुझे "${title}" का फॉर्म भरवाना है। कृपया बताएँ कौनसे दस्तावेज़ लाने हैं।`
    : "नमस्ते, मुझे एक सरकारी फॉर्म भरवाना है। कृपया जानकारी दें।";
}
