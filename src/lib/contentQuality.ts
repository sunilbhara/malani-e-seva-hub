// Pre-publish content checks shown in the post editor. Advice, not blockers: hard rules stay in
// lib/postForm.ts. Thresholds follow docs/UX_AUDIT_AND_REDESIGN.md (AdSense "low value content").

export const MIN_WORDS = 600;

/** Words in rich-text HTML (tags and &nbsp; removed). */
export function wordCount(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
}

/** Share of letters that are Latin (0..1). Digits, punctuation and spaces are ignored. */
export function latinShare(text: string): number {
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  const devanagari = (text.match(/[ऀ-ॿ]/g) ?? []).length;
  const total = latin + devanagari;
  return total ? latin / total : 0;
}

export interface QualityInput {
  title: string;
  content: string;
  isJob: boolean;
  applyLink: string;
  officialLink: string;
  officialWebsite: string;
  imageUrl: string;
  seoDescription: string;
  duplicateTitles: string[];
}

export interface QualityCheck {
  id: string;
  ok: boolean;
  text: string;
}

export function qualityChecks(f: QualityInput): QualityCheck[] {
  const words = wordCount(f.content);
  const englishTitle = f.title.trim().length > 0 && latinShare(f.title) > 0.6;
  const hasOfficial = Boolean(f.officialLink.trim() || f.officialWebsite.trim() || (f.isJob && f.applyLink.trim()));
  return [
    {
      id: "words",
      ok: words >= MIN_WORDS,
      text: words >= MIN_WORDS ? `${words} शब्द — अच्छी लंबाई` : `${words} शब्द — कम से कम ${MIN_WORDS} शब्द लिखें (पात्रता, फॉर्म कैसे भरें, ज़रूरी दस्तावेज़, आम गलतियाँ)`,
    },
    {
      id: "hindi-title",
      ok: !englishTitle,
      text: englishTitle ? "शीर्षक ज़्यादातर अंग्रेज़ी में है — अपने शब्दों में हिंदी शीर्षक लिखें" : "शीर्षक हिंदी में है",
    },
    {
      id: "official",
      ok: hasOfficial,
      text: hasOfficial ? "आधिकारिक लिंक जुड़ा है" : "आधिकारिक वेबसाइट या अधिसूचना का लिंक जोड़ें",
    },
    {
      id: "duplicate",
      ok: f.duplicateTitles.length === 0,
      text: f.duplicateTitles.length ? `मिलती-जुलती पोस्ट पहले से है: “${f.duplicateTitles[0]}”` : "इस शीर्षक की कोई दूसरी पोस्ट नहीं",
    },
    { id: "cover", ok: Boolean(f.imageUrl), text: f.imageUrl ? "कवर फोटो लगी है" : "कवर फोटो जोड़ें — WhatsApp पर शेयर अच्छा दिखता है" },
    {
      id: "seo",
      ok: f.seoDescription.trim().length >= 70,
      text: f.seoDescription.trim().length >= 70 ? "SEO विवरण ठीक है" : "SEO विवरण 70–160 अक्षर में लिखें",
    },
  ];
}
