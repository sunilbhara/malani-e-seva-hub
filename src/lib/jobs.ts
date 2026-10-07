// Job vocabulary: Hindi labels, statuses and colours shared by cards, filters and the admin editor.
import { daysUntil, istToday } from "@/lib/format";

export const QUALIFICATIONS = [
  { value: "8th", label: "8वीं पास" },
  { value: "10th", label: "10वीं पास" },
  { value: "12th", label: "12वीं पास" },
  { value: "iti", label: "ITI" },
  { value: "diploma", label: "डिप्लोमा" },
  { value: "graduate", label: "ग्रेजुएट" },
  { value: "postgraduate", label: "पोस्ट-ग्रेजुएट" },
  { value: "any", label: "कोई भी" },
] as const;

export const DEPARTMENTS = [
  { value: "police", label: "पुलिस" },
  { value: "army", label: "सेना" },
  { value: "railway", label: "रेलवे" },
  { value: "bank", label: "बैंक" },
  { value: "ssc", label: "SSC" },
  { value: "rpsc", label: "RPSC" },
  { value: "rsmssb", label: "RSMSSB" },
  { value: "upsc", label: "UPSC" },
  { value: "teacher", label: "शिक्षक" },
  { value: "patwari", label: "पटवारी" },
  { value: "clerk", label: "क्लर्क" },
  { value: "health", label: "स्वास्थ्य" },
  { value: "electricity", label: "बिजली विभाग" },
  { value: "other", label: "अन्य" },
] as const;

export const STATES = [
  { value: "rajasthan", label: "राजस्थान" },
  { value: "all_india", label: "केंद्र / पूरे भारत" },
  { value: "other", label: "अन्य राज्य" },
] as const;

export const POST_TYPES = [
  { value: "job", label: "नई भर्ती", short: "भर्ती" },
  { value: "admit_card", label: "एडमिट कार्ड", short: "एडमिट कार्ड" },
  { value: "result", label: "रिजल्ट", short: "रिजल्ट" },
  { value: "exam", label: "परीक्षा तिथि", short: "परीक्षा" },
  { value: "local_news", label: "बाड़मेर अपडेट", short: "अपडेट" },
  { value: "guide", label: "जानकारी / गाइड", short: "गाइड" },
  { value: "article", label: "लेख", short: "लेख" },
] as const;

export type Qualification = (typeof QUALIFICATIONS)[number]["value"];
export type Department = (typeof DEPARTMENTS)[number]["value"];
export type PostType = (typeof POST_TYPES)[number]["value"];
export type JobStatus = "upcoming" | "open" | "closing" | "closed";

const labelOf = <T extends { value: string; label: string }>(list: readonly T[], value: string | null | undefined) =>
  list.find((i) => i.value === value)?.label ?? value ?? "";

export const qualificationLabel = (v: string | null | undefined) => labelOf(QUALIFICATIONS, v);
export const departmentLabel = (v: string | null | undefined) => labelOf(DEPARTMENTS, v);
export const stateLabel = (v: string | null | undefined) => labelOf(STATES, v);
export const postTypeLabel = (v: string | null | undefined) => labelOf(POST_TYPES, v ?? "article");
export const postTypeShort = (v: string | null | undefined) =>
  POST_TYPES.find((p) => p.value === (v ?? "article"))?.short ?? "लेख";

/** Same rules as the list_posts SQL function, so client and server always agree. */
export function jobStatus(lastDate: string | null | undefined, applyStart?: string | null, today = istToday()): JobStatus | null {
  if (!lastDate) return null;
  const left = daysUntil(lastDate, today);
  if (left === null) return null;
  if (left < 0) return "closed";
  if (applyStart && (daysUntil(applyStart, today) ?? 0) > 0) return "upcoming";
  if (left <= 7) return "closing";
  return "open";
}

/** Short countdown text for a last date. */
export function countdownLabel(lastDate: string | null | undefined, today = istToday()): string {
  const left = daysUntil(lastDate, today);
  if (left === null) return "";
  if (left < 0) return "आवेदन बंद";
  if (left === 0) return "आज अंतिम दिन";
  if (left === 1) return "कल अंतिम दिन";
  return `${left} दिन बचे`;
}

export const STATUS_LABEL: Record<JobStatus, string> = {
  upcoming: "जल्द शुरू",
  open: "आवेदन जारी",
  closing: "अंतिम तिथि नज़दीक",
  closed: "आवेदन बंद",
};

/** Tailwind classes per status (text on tinted background, Blueprint §4.2). */
export function statusClasses(status: JobStatus | null, daysLeft?: number | null): string {
  if (status === "closed") return "bg-status-closed-bg text-status-closed";
  if (status === "closing" && typeof daysLeft === "number" && daysLeft <= 1) return "bg-status-urgent-bg text-status-urgent";
  if (status === "closing") return "bg-status-soon-bg text-status-soon";
  if (status === "upcoming") return "bg-secondary text-secondary-foreground";
  if (status === "open") return "bg-status-open-bg text-status-open";
  return "bg-muted text-muted-foreground";
}

export const TYPE_BORDER: Record<string, string> = {
  job: "border-l-type-job",
  admit_card: "border-l-type-admit",
  result: "border-l-type-result",
  exam: "border-l-type-exam",
  local_news: "border-l-type-news",
  guide: "border-l-type-news",
  article: "border-l-type-news",
};

export const TYPE_TEXT: Record<string, string> = {
  job: "text-type-job",
  admit_card: "text-type-admit",
  result: "text-type-result",
  exam: "text-type-exam",
  local_news: "text-type-news",
  guide: "text-type-news",
  article: "text-type-news",
};

export type FeeRow = {
  category: string;
  amount: number;
};

export type ExtraDate = {
  label: string;
  date: string;
};

export function parseFees(value: unknown): FeeRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((f) => f as Partial<FeeRow>)
    .filter((f): f is FeeRow => typeof f?.category === "string" && typeof f?.amount === "number");
}

export function parseExtraDates(value: unknown): ExtraDate[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((d) => d as Partial<ExtraDate>)
    .filter((d): d is ExtraDate => typeof d?.label === "string" && typeof d?.date === "string");
}
