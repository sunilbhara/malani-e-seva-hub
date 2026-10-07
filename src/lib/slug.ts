import { slugify } from "transliteration";

/** URL slug from a (possibly Hindi) title, transliterated to Latin. Loaded lazily: the
 * transliteration tables are ~180 kB and only the admin editor needs them. */
export function baseSlug(title: string): string {
  const base = slugify(title || "", { lowercase: true, separator: "-" })
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return base || "post";
}
