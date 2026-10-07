import { describe, expect, it } from "vitest";
import { IMAGE_SPECS, drawPlan, formatPrice, validateCatalogFile, validateDimensions } from "@/lib/catalogImage";
import { catalogFormProblems, parseFeatures, parsePrice, type CatalogForm } from "@/lib/catalogForm";

const file = (type: string, size: number) => {
  const f = new File(["x"], "a", { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
};

describe("catalog image rules", () => {
  it("accepts JPG/PNG/WebP up to 15 MB only", () => {
    expect(validateCatalogFile(file("image/jpeg", 1000))).toBeNull();
    expect(validateCatalogFile(file("image/webp", 15 * 1024 * 1024))).toBeNull();
    expect(validateCatalogFile(file("image/gif", 1000))).toMatch(/JPG, PNG या WebP/);
    expect(validateCatalogFile(file("image/png", 15 * 1024 * 1024 + 1))).toMatch(/15 MB/);
  });

  it("rejects photos smaller than the minimum side for their kind", () => {
    expect(validateDimensions("product", 500, 900)).toBeNull();
    expect(validateDimensions("product", 499, 900)).toMatch(/499×900/);
    expect(validateDimensions("studio_photo", 600, 600)).toBeNull();
    expect(validateDimensions("studio_photo", 900, 590)).toMatch(/कम से कम 600 px/);
  });

  it("output sizes are fixed per kind", () => {
    expect(IMAGE_SPECS.product).toMatchObject({ width: 800, height: 800 });
    expect(IMAGE_SPECS.studio_photo).toMatchObject({ width: 900, height: 1200 });
  });

  it("crop takes the centred part that matches the output shape", () => {
    // Landscape into a square: trim the sides.
    expect(drawPlan(1600, 1000, 800, 800, "crop")).toEqual({ sx: 300, sy: 0, sw: 1000, sh: 1000, dx: 0, dy: 0, dw: 800, dh: 800 });
    // Square into 3:4: trim the sides.
    expect(drawPlan(1200, 1200, 900, 1200, "crop")).toEqual({ sx: 150, sy: 0, sw: 900, sh: 1200, dx: 0, dy: 0, dw: 900, dh: 1200 });
    // Tall into a square: trim top and bottom.
    expect(drawPlan(1000, 2000, 800, 800, "crop")).toEqual({ sx: 0, sy: 500, sw: 1000, sh: 1000, dx: 0, dy: 0, dw: 800, dh: 800 });
  });

  it("fit keeps the whole photo, centred with margins", () => {
    expect(drawPlan(1600, 1000, 800, 800, "fit")).toEqual({ sx: 0, sy: 0, sw: 1600, sh: 1000, dx: 0, dy: 150, dw: 800, dh: 500 });
    expect(drawPlan(1000, 1000, 900, 1200, "fit")).toEqual({ sx: 0, sy: 0, sw: 1000, sh: 1000, dx: 0, dy: 150, dw: 900, dh: 900 });
  });

  it("formats prices in Indian style", () => {
    expect(formatPrice(134900)).toBe("₹1,34,900");
    expect(formatPrice(0)).toBe("₹0");
    expect(formatPrice(null)).toBeNull();
  });
});

describe("catalog form", () => {
  const base: CatalogForm = { kind: "product", category: "mobiles", title: "Vivo Y29", priceText: "", featuresText: "", isActive: true, hasImage: true };

  it("parses prices written the usual ways", () => {
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("  ")).toBeNull();
    expect(parsePrice("79999")).toBe(79999);
    expect(parsePrice("₹1,34,900")).toBe(134900);
    expect(parsePrice("12k")).toBeUndefined();
    expect(parsePrice("-5")).toBeUndefined();
    expect(parsePrice("99999999")).toBeUndefined();
  });

  it("splits features by line or comma, drops blanks, keeps six", () => {
    expect(parseFeatures("A\n\n B ,C")).toEqual(["A", "B", "C"]);
    expect(parseFeatures("1\n2\n3\n4\n5\n6\n7")).toHaveLength(6);
  });

  it("reports missing photo, name and bad price", () => {
    expect(catalogFormProblems(base)).toEqual([]);
    expect(catalogFormProblems({ ...base, hasImage: false, title: " ", priceText: "abc" })).toEqual([
      "फोटो चुनें।",
      "प्रोडक्ट का नाम लिखें।",
      "दाम सिर्फ़ रुपये में अंकों में लिखें, जैसे 79999।",
    ]);
    expect(catalogFormProblems({ ...base, featuresText: "x".repeat(41) })).toEqual(["हर खूबी 40 अक्षरों से छोटी रखें।"]);
  });

  it("studio photos ignore price and features", () => {
    expect(catalogFormProblems({ ...base, kind: "studio_photo", category: "weddings", priceText: "abc", title: "" })).toEqual(["फोटो का शीर्षक लिखें।"]);
  });
});
