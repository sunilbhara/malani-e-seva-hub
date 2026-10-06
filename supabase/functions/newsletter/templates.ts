import { escapeHtml } from "../_shared/http.ts";
import { BUSINESS, fullAddress } from "../_shared/business.ts";

export const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL_PATTERN.test(value.trim());
}

export const CONSENT_TEXT =
  "मैं मालाणी बाड़मेर से सरकारी नौकरी अपडेट ईमेल पाना चाहता/चाहती हूँ। मैं कभी भी अनसब्सक्राइब कर सकता/सकती हूँ।";

function layout(title: string, body: string, unsubscribeUrl?: string): string {
  return `<!doctype html><html lang="hi"><body style="margin:0;background:#F8FAFC;font-family:'Noto Sans Devanagari',Arial,sans-serif;color:#0F172A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:560px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px" cellpadding="0" cellspacing="0">
<tr><td style="background:#1E3A8A;color:#FFFFFF;padding:16px 24px;border-radius:16px 16px 0 0;font-size:18px;font-weight:700">${escapeHtml(BUSINESS.name)}</td></tr>
<tr><td style="padding:24px;line-height:1.7;font-size:16px"><h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(title)}</h1>${body}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #E2E8F0;font-size:12px;color:#64748B;line-height:1.6">
${escapeHtml(BUSINESS.nameHi)} · ${escapeHtml(fullAddress("hi"))} · ${escapeHtml(BUSINESS.phone)}<br>
${unsubscribeUrl ? `<a href="${escapeHtml(unsubscribeUrl)}" style="color:#64748B">अनसब्सक्राइब करें</a>` : ""}
</td></tr></table></td></tr></table></body></html>`;
}

export function confirmEmail(confirmUrl: string, unsubscribeUrl: string): { subject: string; html: string } {
  const button = `<p style="margin:24px 0"><a href="${escapeHtml(confirmUrl)}" style="background:#1D4ED8;color:#FFFFFF;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:600">हाँ, मुझे अपडेट भेजें</a></p>`;
  return {
    subject: "कृपया अपनी ईमेल की पुष्टि करें — मालाणी जॉब अलर्ट",
    html: layout(
      "बस एक कदम और",
      `<p>मालाणी बाड़मेर के सरकारी नौकरी अलर्ट के लिए धन्यवाद। अपडेट पाने के लिए नीचे बटन दबाएँ।</p>${button}<p style="font-size:13px;color:#64748B">अगर आपने यह अनुरोध नहीं किया है, तो इस ईमेल को अनदेखा करें।</p>`,
      unsubscribeUrl,
    ),
  };
}

export interface DigestItem {
  title: string;
  url: string;
  lastDate?: string | null;
  totalPosts?: number | null;
}

function formatDateHi(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["जन", "फर", "मार्च", "अप्रै", "मई", "जून", "जुला", "अग", "सितं", "अक्टू", "नवं", "दिसं"];
  return `${d} ${months[m - 1]} ${y}`;
}

function itemList(items: DigestItem[]): string {
  return `<ul style="padding-left:18px;margin:0 0 16px">${items
    .map((i) => {
      const facts = [
        i.totalPosts ? `${i.totalPosts.toLocaleString("en-IN")} पद` : null,
        i.lastDate ? `अंतिम तिथि ${formatDateHi(i.lastDate)}` : null,
      ].filter(Boolean).join(" · ");
      return `<li style="margin-bottom:10px"><a href="${escapeHtml(i.url)}" style="color:#1D4ED8;font-weight:600">${escapeHtml(i.title)}</a>${facts ? `<br><span style="font-size:13px;color:#475569">${escapeHtml(facts)}</span>` : ""}</li>`;
    })
    .join("")}</ul>`;
}

export function digestEmail(newItems: DigestItem[], closingSoon: DigestItem[], unsubscribeUrl: string, siteUrl: string) {
  const sections = [
    newItems.length ? `<h2 style="font-size:17px;margin:16px 0 8px">इस हफ़्ते की नई अपडेट</h2>${itemList(newItems)}` : "",
    closingSoon.length ? `<h2 style="font-size:17px;margin:16px 0 8px">⏰ अंतिम तिथि नज़दीक</h2>${itemList(closingSoon)}` : "",
    `<p><a href="${escapeHtml(siteUrl)}/jobs" style="color:#1D4ED8">सभी नौकरियाँ देखें →</a></p>`,
    `<p style="background:#FFFBEB;border-radius:12px;padding:12px 16px">फॉर्म भरने में मदद चाहिए? ${escapeHtml(BUSINESS.nameHi)} पर आएँ या WhatsApp करें: ${escapeHtml(BUSINESS.phone)}</p>`,
  ].join("");
  return {
    subject: `इस हफ़्ते की ${newItems.length} सरकारी नौकरी अपडेट — मालाणी`,
    html: layout("आपका साप्ताहिक जॉब अपडेट", sections, unsubscribeUrl),
  };
}
