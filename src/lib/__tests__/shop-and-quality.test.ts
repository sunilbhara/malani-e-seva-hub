import { describe, expect, it } from "vitest";
import { discountPercent, MAX_OUTPUT_BYTES } from "@/lib/catalogImage";
import { catalogFormProblems, type CatalogForm } from "@/lib/catalogForm";
import { MIN_WORDS, latinShare, qualityChecks, wordCount } from "@/lib/contentQuality";

describe("price cut", () => {
  it("shows a whole-number discount only when MRP is above the price", () => {
    expect(discountPercent(79999, 89999)).toBe(11);
    expect(discountPercent(500, 1000)).toBe(50);
    expect(discountPercent(1000, 1000)).toBeNull();
    expect(discountPercent(1000, 900)).toBeNull();
    expect(discountPercent(null, 1000)).toBeNull();
    expect(discountPercent(1000, null)).toBeNull();
    expect(discountPercent(999, 1000)).toBeNull(); // rounds to 0%
  });

  it("product photos must end up within the 300 KB free-tier limit", () => {
    expect(MAX_OUTPUT_BYTES).toBe(300 * 1024);
  });

  const base: CatalogForm = { kind: "product", category: "mobiles", title: "Phone", priceText: "79999", mrpText: "", featuresText: "", isActive: true, hasImage: true };

  it("validates MRP against the selling price", () => {
    expect(catalogFormProblems(base)).toEqual([]);
    expect(catalogFormProblems({ ...base, mrpText: "89999" })).toEqual([]);
    expect(catalogFormProblems({ ...base, mrpText: "70000" })).toContain("MRP बिक्री के दाम से कम नहीं हो सकती।");
    expect(catalogFormProblems({ ...base, mrpText: "abc" })).toContain("MRP सिर्फ़ रुपये में अंकों में लिखें, जैसे 89999।");
    expect(catalogFormProblems({ ...base, priceText: "", mrpText: "100" })).toContain("MRP के साथ बिक्री का दाम भी लिखें।");
  });
});

describe("content quality checks", () => {
  const html = (words: number) => `<h2>शीर्षक</h2><p>${Array.from({ length: words - 1 }, () => "शब्द").join(" ")}</p>`;
  const input = {
    title: "राजस्थान पुलिस भर्ती 2026 — 9617 पद",
    content: html(MIN_WORDS),
    isJob: true,
    applyLink: "https://police.rajasthan.gov.in",
    officialLink: "",
    officialWebsite: "",
    imageUrl: "https://x/cover.webp",
    seoDescription: "राजस्थान पुलिस ने 9617 पदों पर भर्ती निकाली है — योग्यता, अंतिम तिथि और आवेदन का तरीका जानें।",
    duplicateTitles: [],
  };

  it("counts words without HTML", () => {
    expect(wordCount("<p>एक&nbsp;दो</p><p> तीन </p>")).toBe(3);
    expect(wordCount("")).toBe(0);
  });

  it("measures how much of a title is English", () => {
    expect(latinShare("RRB NTPC Graduate Level Online Form")).toBe(1);
    expect(latinShare("राजस्थान पुलिस भर्ती 2026")).toBe(0);
  });

  it("a complete Hindi post passes every check", () => {
    expect(qualityChecks(input).every((c) => c.ok)).toBe(true);
  });

  it("flags thin, English, unlinked, duplicate posts without a cover", () => {
    const failed = qualityChecks({
      ...input,
      title: "RRB NTPC Graduate Level Online Form 2026",
      content: html(125),
      applyLink: "",
      imageUrl: "",
      seoDescription: "",
      duplicateTitles: ["RRB NTPC Graduate Level Online Form 2026"],
    })
      .filter((c) => !c.ok)
      .map((c) => c.id);
    expect(failed).toEqual(["words", "hindi-title", "official", "duplicate", "cover", "seo"]);
  });
});
