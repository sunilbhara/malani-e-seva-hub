import type { CatalogKind } from "@/lib/catalogImage";

export interface CatalogForm {
  kind: CatalogKind;
  category: string;
  title: string;
  priceText: string;
  featuresText: string;
  isActive: boolean;
  hasImage: boolean;
}

/** "₹1,34,900" / "134900" / "" → 134900 / null; undefined when not a valid rupee amount. */
export function parsePrice(text: string): number | null | undefined {
  const cleaned = text.replace(/[₹,\s]/g, "");
  if (!cleaned) return null;
  if (!/^\d{1,8}$/.test(cleaned)) return undefined;
  const n = Number(cleaned);
  return n <= 10_000_000 ? n : undefined;
}

/** One feature per line (commas also split); blanks dropped, max 6. */
export function parseFeatures(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function catalogFormProblems(form: CatalogForm): string[] {
  const problems: string[] = [];
  if (!form.hasImage) problems.push("फोटो चुनें।");
  if (!form.title.trim()) problems.push(form.kind === "product" ? "प्रोडक्ट का नाम लिखें।" : "फोटो का शीर्षक लिखें।");
  if (form.title.trim().length > 120) problems.push("नाम 120 अक्षरों से छोटा रखें।");
  if (!form.category) problems.push("श्रेणी चुनें।");
  if (form.kind === "product") {
    if (parsePrice(form.priceText) === undefined) problems.push("दाम सिर्फ़ रुपये में अंकों में लिखें, जैसे 79999।");
    if (parseFeatures(form.featuresText).some((f) => f.length > 40)) problems.push("हर खूबी 40 अक्षरों से छोटी रखें।");
  }
  return problems;
}
