import type { CatalogKind } from "@/lib/catalogImage";

export interface CatalogForm {
  kind: CatalogKind;
  category: string;
  title: string;
  priceText: string;
  /** Original price (MRP) for the price-cut display; optional. */
  mrpText?: string;
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
    const price = parsePrice(form.priceText);
    const mrp = parsePrice(form.mrpText ?? "");
    if (price === undefined) problems.push("दाम सिर्फ़ रुपये में अंकों में लिखें, जैसे 79999।");
    if (mrp === undefined) problems.push("MRP सिर्फ़ रुपये में अंकों में लिखें, जैसे 89999।");
    if (typeof price === "number" && typeof mrp === "number" && mrp < price) problems.push("MRP बिक्री के दाम से कम नहीं हो सकती।");
    if (mrp !== null && mrp !== undefined && price === null) problems.push("MRP के साथ बिक्री का दाम भी लिखें।");
    if (parseFeatures(form.featuresText).some((f) => f.length > 40)) problems.push("हर खूबी 40 अक्षरों से छोटी रखें।");
  }
  return problems;
}
