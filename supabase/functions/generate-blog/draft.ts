import { BUSINESS, fullAddress } from "../_shared/business.ts";

export const QUALIFICATIONS = ["8th", "10th", "12th", "iti", "diploma", "graduate", "postgraduate", "any"] as const;
export const DEPARTMENTS = [
  "police", "army", "railway", "bank", "ssc", "rpsc", "rsmssb", "upsc",
  "teacher", "patwari", "clerk", "health", "electricity", "other",
] as const;
export const POST_TYPES = ["job", "admit_card", "result", "exam", "local_news", "guide", "article"] as const;

export const SYSTEM_PROMPT = `आप एक अनुभवी हिंदी SEO लेखक हैं जो सरकारी नौकरी, भर्ती, एडमिट कार्ड, रिजल्ट और परीक्षा की जानकारी लिखते हैं।
पाठक गांव और छोटे शहरों के युवा हैं जो मोबाइल पर पढ़ते हैं। भाषा सरल, साफ और भरोसेमंद रखें।

नियम:
- केवल वही जानकारी लिखें जो नीचे दी गई जानकारी में है। कोई तारीख, संख्या या लिंक अपनी तरफ से न बनाएं।
- जो जानकारी उपलब्ध नहीं है उसके लिए "आधिकारिक अधिसूचना देखें" लिखें।
- content फ़ील्ड में साफ़ HTML दें: केवल <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <a href="https://...">।
- छोटे पैराग्राफ, बुलेट पॉइंट और ज़रूरत हो तो तालिका (महत्वपूर्ण तिथियाँ, आवेदन शुल्क) का उपयोग करें।
- सेक्शन क्रम: संक्षिप्त परिचय, महत्वपूर्ण तिथियाँ, पद विवरण, योग्यता, आयु सीमा, आवेदन शुल्क, चयन प्रक्रिया, आवेदन कैसे करें, ज़रूरी दस्तावेज, निष्कर्ष।
- अंत में एक पंक्ति जोड़ें: फॉर्म भरवाने में मदद के लिए ${BUSINESS.nameHi}, ${fullAddress("hi")} (संपर्क: ${BUSINESS.phone}) पर आएं।
- job फ़ील्ड में तारीखें YYYY-MM-DD में दें; जो पता न हो उसे null रखें।`;

export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING", description: "Hindi SEO title, max 70 characters, include post count and last date if known" },
    metaDescription: { type: "STRING", description: "Hindi meta description, max 160 characters" },
    content: { type: "STRING", description: "Article body as clean semantic HTML (allowed tags only)" },
    postType: { type: "STRING", enum: [...POST_TYPES] },
    tags: { type: "ARRAY", items: { type: "STRING" } },
    job: {
      type: "OBJECT",
      nullable: true,
      properties: {
        organisation: { type: "STRING", nullable: true },
        totalPosts: { type: "INTEGER", nullable: true },
        qualifications: { type: "ARRAY", items: { type: "STRING", enum: [...QUALIFICATIONS] } },
        departments: { type: "ARRAY", items: { type: "STRING", enum: [...DEPARTMENTS] } },
        state: { type: "STRING", enum: ["rajasthan", "all_india", "other"], nullable: true },
        ageMin: { type: "INTEGER", nullable: true },
        ageMax: { type: "INTEGER", nullable: true },
        applyStart: { type: "STRING", nullable: true },
        lastDate: { type: "STRING", nullable: true },
        feeLastDate: { type: "STRING", nullable: true },
        examDate: { type: "STRING", nullable: true },
        admitCardDate: { type: "STRING", nullable: true },
        resultDate: { type: "STRING", nullable: true },
        salary: { type: "STRING", nullable: true },
        fees: {
          type: "ARRAY",
          items: { type: "OBJECT", properties: { category: { type: "STRING" }, amount: { type: "INTEGER" } } },
        },
        applyLink: { type: "STRING", nullable: true },
        notificationPdf: { type: "STRING", nullable: true },
        officialWebsite: { type: "STRING", nullable: true },
      },
    },
  },
  required: ["title", "metaDescription", "content", "postType"],
} as const;

export interface JobDraft {
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

export interface BlogDraft {
  title: string;
  metaDescription: string;
  content: string;
  postType: (typeof POST_TYPES)[number];
  tags: string[];
  job: JobDraft | null;
}

const ALLOWED_TAGS = new Set([
  "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "b", "em", "i", "br",
  "table", "thead", "tbody", "tr", "th", "td", "a", "blockquote",
]);

/** Keeps only the allowed tags; drops scripts/styles entirely and all attributes except safe hrefs. */
export function sanitizeHtml(html: string): string {
  let out = html.replace(/<(script|style|iframe|object|embed|noscript)[\s\S]*?<\/\1\s*>/gi, "");
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (match.startsWith("</")) return `</${tag}>`;
    if (tag === "a") {
      const href = /href\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? /href\s*=\s*'([^']*)'/i.exec(attrs)?.[1];
      return href && safeUrl(href) ? `<a href="${href}" target="_blank" rel="noopener noreferrer">` : "<a>";
    }
    return `<${tag}>`;
  });
  return out.trim();
}

export function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^https?:\/\/[^\s"'<>]+$/i.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function isoDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}

function intOrNull(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function normaliseDraft(raw: unknown): BlogDraft {
  const r = (raw ?? {}) as Record<string, unknown>;
  const postType = POST_TYPES.includes(r.postType as never) ? (r.postType as BlogDraft["postType"]) : "article";
  const tags = Array.isArray(r.tags)
    ? Array.from(new Set(r.tags.map((t) => text(t, 40)).filter(Boolean))).slice(0, 10)
    : [];
  const j = r.job && typeof r.job === "object" ? (r.job as Record<string, unknown>) : null;

  let job: JobDraft | null = null;
  if (j) {
    const ageMin = intOrNull(j.ageMin, 14, 70);
    const ageMax = intOrNull(j.ageMax, 14, 70);
    job = {
      organisation: text(j.organisation, 160) || null,
      totalPosts: intOrNull(j.totalPosts, 1, 10_000_000),
      qualifications: Array.isArray(j.qualifications)
        ? Array.from(new Set(j.qualifications.filter((q) => QUALIFICATIONS.includes(q as never)) as string[]))
        : [],
      departments: Array.isArray(j.departments)
        ? Array.from(new Set(j.departments.filter((d) => DEPARTMENTS.includes(d as never)) as string[]))
        : [],
      state: j.state === "all_india" || j.state === "other" ? j.state : "rajasthan",
      ageMin,
      ageMax: ageMin !== null && ageMax !== null && ageMax < ageMin ? null : ageMax,
      applyStart: isoDate(j.applyStart),
      lastDate: isoDate(j.lastDate),
      feeLastDate: isoDate(j.feeLastDate),
      examDate: isoDate(j.examDate),
      admitCardDate: isoDate(j.admitCardDate),
      resultDate: isoDate(j.resultDate),
      salary: text(j.salary, 160) || null,
      fees: Array.isArray(j.fees)
        ? j.fees
            .map((f) => f as Record<string, unknown>)
            .map((f) => ({ category: text(f?.category, 60), amount: intOrNull(f?.amount, 0, 100_000) }))
            .filter((f): f is { category: string; amount: number } => Boolean(f.category) && f.amount !== null)
            .slice(0, 10)
        : [],
      applyLink: safeUrl(j.applyLink),
      notificationPdf: safeUrl(j.notificationPdf),
      officialWebsite: safeUrl(j.officialWebsite),
    };
    if (job.applyStart && job.lastDate && job.applyStart > job.lastDate) job.applyStart = null;
    const hasAnything = Object.entries(job).some(([, v]) => (Array.isArray(v) ? v.length > 0 : v !== null && v !== "rajasthan"));
    if (!hasAnything) job = null;
  }

  return {
    title: text(r.title, 180),
    metaDescription: text(r.metaDescription, 170),
    content: sanitizeHtml(typeof r.content === "string" ? r.content : ""),
    postType,
    tags,
    job,
  };
}

export function buildPrompt(rawDetails: string): string {
  return `${SYSTEM_PROMPT}\n\nजानकारी:\n${rawDetails}\n\nकृपया केवल JSON में जवाब दें।`;
}
