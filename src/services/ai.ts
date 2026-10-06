// AI drafting for admins (generate-blog edge function, audit S1/B5).
import DOMPurify from "dompurify";
import { invokeFunction } from "@/services/functions";

export interface AiJobDraft {
  organisation: string | null;
  totalPosts: number | null;
  qualifications: string[];
  departments: string[];
  state: "rajasthan" | "all_india" | "other";
  ageMin: number | null;
  ageMax: number | null;
  applyStart: string | null;
  lastDate: string | null;
  feeLastDate: string | null;
  examDate: string | null;
  admitCardDate: string | null;
  resultDate: string | null;
  salary: string | null;
  fees: Array<{ category: string; amount: number }>;
  applyLink: string | null;
  notificationPdf: string | null;
  officialWebsite: string | null;
}

export interface AiDraft {
  title: string;
  metaDescription: string;
  content: string;
  postType: string;
  tags: string[];
  job: AiJobDraft | null;
}

export async function generateDraft(rawDetails: string): Promise<AiDraft> {
  const trimmed = rawDetails.trim();
  if (!trimmed) throw new Error("पहले भर्ती की जानकारी पेस्ट करें।");
  const draft = await invokeFunction<AiDraft>("generate-blog", { rawDetails: trimmed });
  // Defence in depth: the editor only ever receives sanitised HTML.
  return { ...draft, content: DOMPurify.sanitize(draft.content, { USE_PROFILES: { html: true } }) };
}
