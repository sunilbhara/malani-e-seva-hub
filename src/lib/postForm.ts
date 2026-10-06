import type { PostStatus } from "@/services/posts";
import type { ExtraDate, FeeRow } from "@/lib/jobs";
import { safeHttpUrl } from "@/lib/url";
import { stripHtml } from "@/lib/html";

/** Admin post editor form state (strings as typed; converted to DB rows on save). */
export interface PostFormState {
  title: string;
  content: string;
  postType: string;
  category: string;
  tags: string;
  imageUrl: string;
  seoTitle: string;
  seoDescription: string;
  sourceUrl: string;
  officialLink: string;
  isVerified: boolean;
  language: "hi" | "en";
  status: PostStatus;
  scheduledAt: string;
  hasJob: boolean;
  recruitmentId: string;
  organisation: string;
  totalPosts: string;
  qualifications: string[];
  departments: string[];
  state: string;
  ageMin: string;
  ageMax: string;
  salary: string;
  fees: FeeRow[];
  applyStart: string;
  lastDate: string;
  feeLastDate: string;
  admitCardDate: string;
  examDate: string;
  resultDate: string;
  extraDates: ExtraDate[];
  applyLink: string;
  notificationPdf: string;
  officialWebsite: string;
}

/** Validates the form; returns a list of Hindi error messages. */
export function validatePostForm(f: PostFormState): string[] {
  const errors: string[] = [];
  if (!f.title.trim()) errors.push("शीर्षक लिखें।");
  if (f.title.length > 180) errors.push("शीर्षक 180 अक्षरों से छोटा रखें।");
  if (!stripHtml(f.content)) errors.push("पोस्ट का विवरण लिखें।");
  if (f.status === "scheduled") {
    if (!f.scheduledAt) errors.push("शेड्यूल का समय चुनें।");
    else if (new Date(f.scheduledAt).getTime() < Date.now() - 60_000) errors.push("शेड्यूल का समय भविष्य में होना चाहिए।");
  }
  const urls: Array<[string, string]> = [
    [f.imageUrl, "फोटो"],
    [f.sourceUrl, "स्रोत लिंक"],
    [f.officialLink, "आधिकारिक लिंक"],
  ];
  if (f.hasJob) urls.push([f.applyLink, "आवेदन लिंक"], [f.notificationPdf, "अधिसूचना PDF"], [f.officialWebsite, "आधिकारिक वेबसाइट"]);
  for (const [value, label] of urls) {
    if (value.trim() && !safeHttpUrl(value)) errors.push(`${label}: केवल https:// वाला लिंक डालें।`);
  }
  if (f.hasJob) {
    if (f.organisation.trim().length < 2) errors.push("भर्ती का विभाग/संस्था लिखें।");
    if (f.applyStart && f.lastDate && f.applyStart > f.lastDate) errors.push("आवेदन शुरू की तिथि अंतिम तिथि से पहले होनी चाहिए।");
    if (f.ageMin && f.ageMax && Number(f.ageMin) > Number(f.ageMax)) errors.push("न्यूनतम आयु अधिकतम से कम होनी चाहिए।");
    if (f.totalPosts && (!Number.isInteger(Number(f.totalPosts)) || Number(f.totalPosts) <= 0)) errors.push("कुल पद एक सही संख्या होनी चाहिए।");
  }
  return errors;
}
