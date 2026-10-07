import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";

/** A real PNG of the given size, drawn in the page so createImageBitmap can decode it. */
async function pngFile(page: Page, width: number, height: number) {
  const dataUrl = await page.evaluate(
    ([w, h]) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(w / 4, h / 4, w / 2, h / 2);
      return c.toDataURL("image/png");
    },
    [width, height] as const,
  );
  return { name: `photo-${width}x${height}.png`, mimeType: "image/png", buffer: Buffer.from(dataUrl.split(",")[1], "base64") };
}

test.describe("Shop pages (reader)", () => {
  test.beforeEach(async ({ skipPreferenceSheet }) => skipPreferenceSheet());

  test("products come from the catalog, in a carousel, hidden ones excluded", async ({ page, backend }) => {
    await page.goto("/mobile-electronics");
    const carousel = page.getByRole("region", { name: "प्रोडक्ट" });
    await expect(carousel).toBeVisible();
    await expect(carousel.getByRole("heading", { name: "Redmi Note 14" })).toBeAttached();
    await expect(carousel.getByText("₹17,999")).toBeAttached();
    await expect(carousel.getByText("दाम के लिए पूछें")).toBeAttached();
    await expect(page.getByText("पुराना मॉडल (छुपा)")).toHaveCount(0);
    expect(backend.find((c) => c.path === "/rest/v1/catalog_items" && c.query.get("kind") === "eq.product" && c.query.get("is_active") === "eq.true")).not.toHaveLength(0);

    await page.getByRole("button", { name: "एक्सेसरीज़", exact: true }).click();
    await expect(carousel.getByRole("heading", { name: "boAt Airdopes 141" })).toBeAttached();
    await expect(carousel.getByRole("heading", { name: "Redmi Note 14" })).toHaveCount(0);
    await page.getByRole("button", { name: "अप्लायंसेज़", exact: true }).click();
    await expect(page.getByText("इस श्रेणी में अभी कोई प्रोडक्ट नहीं है।")).toBeVisible();
  });

  test("studio photos open full size", async ({ page }) => {
    await page.goto("/mataji-studio");
    const carousel = page.getByRole("region", { name: "स्टूडियो फोटो" });
    await expect(carousel).toBeVisible();
    await carousel.getByRole("button", { name: "शादी के पल — बड़ी फोटो देखें" }).click();
    await expect(page.getByRole("dialog").getByRole("img", { name: "शादी के पल" })).toBeVisible();
  });

  test("an outage shows a message instead of a broken page", async ({ page, backend }) => {
    backend.failures["catalog_items"] = 500;
    await page.goto("/mobile-electronics");
    await expect(page.getByText("प्रोडक्ट अभी लोड नहीं हो सके।")).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("Admin catalog", () => {
  test.beforeEach(async ({ signInAs, skipPreferenceSheet }) => {
    await skipPreferenceSheet();
    await signInAs("admin");
  });

  test("add a product with a photo: resized, uploaded, saved and shown on the page", async ({ page, backend }) => {
    await page.goto("/admin/catalog");
    await expect(page.getByRole("heading", { name: "दुकान के आइटम" })).toBeVisible();
    await expect(page.getByText("पुराना मॉडल (छुपा)")).toBeVisible();

    await page.getByRole("button", { name: "नया आइटम" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("800×800 px");
    await dialog.getByRole("button", { name: "सेव करें" }).click();
    await expect(page.getByText("फोटो चुनें।")).toBeVisible();

    await dialog.getByLabel("फोटो चुनें").setInputFiles(await pngFile(page, 1600, 1000));
    await expect(dialog.getByRole("img", { name: "फोटो का प्रीव्यू" })).toHaveAttribute("src", /^blob:/);
    await dialog.getByLabel("प्रोडक्ट का नाम").fill("Vivo Y29 5G");
    await dialog.getByLabel("श्रेणी").selectOption("mobiles");
    await dialog.getByLabel(/दाम/).fill("₹13,999");
    await dialog.getByLabel(/खूबियाँ/).fill("6000mAh बैटरी\n\n120Hz डिस्प्ले");
    await dialog.getByRole("button", { name: "सेव करें" }).click();
    await expect(page.getByText("नया आइटम जुड़ गया")).toBeVisible();

    expect(backend.storage.uploaded).toHaveLength(1);
    expect(backend.storage.uploaded[0]).toMatch(/^catalog\/product\/[0-9a-f-]{36}\.(webp|jpg)$/);
    const saved = backend.catalog.find((r) => r.title === "Vivo Y29 5G")!;
    expect(saved).toMatchObject({ kind: "product", category: "mobiles", price: 13999, features: ["6000mAh बैटरी", "120Hz डिस्प्ले"], is_active: true, sort_order: 40 });
    expect(saved.image_url).toMatch(/\/storage\/v1\/object\/public\/catalog\/product\//);
    expect(saved.image_path).toBe(backend.storage.uploaded[0].replace(/^catalog\//, ""));

    await page.goto("/mobile-electronics");
    await expect(page.getByRole("region", { name: "प्रोडक्ट" }).getByRole("heading", { name: "Vivo Y29 5G" })).toBeAttached();
    await expect(page.getByText("₹13,999")).toBeAttached();
  });

  test("rejects photos that are too small and invalid prices", async ({ page, backend }) => {
    await page.goto("/admin/catalog");
    await page.getByRole("button", { name: "नया आइटम" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("फोटो चुनें").setInputFiles(await pngFile(page, 400, 400));
    await expect(page.getByText(/फोटो बहुत छोटी है \(400×400\)/)).toBeVisible();
    await dialog.getByLabel("फोटो चुनें").setInputFiles(await pngFile(page, 900, 900));
    await dialog.getByLabel("प्रोडक्ट का नाम").fill("Test");
    await dialog.getByLabel(/दाम/).fill("12k");
    await dialog.getByRole("button", { name: "सेव करें" }).click();
    await expect(page.getByText("दाम सिर्फ़ रुपये में अंकों में लिखें, जैसे 79999।")).toBeVisible();
    expect(backend.storage.uploaded).toHaveLength(0);
    expect(backend.writes("catalog_items")).toHaveLength(0);
  });

  test("studio photo uses the 3:4 spec", async ({ page, backend }) => {
    await page.goto("/admin/catalog");
    await page.getByRole("tab", { name: "स्टूडियो फोटो" }).click();
    await expect(page.getByText("फैमिली पोर्ट्रेट")).toBeVisible();
    await page.getByRole("button", { name: "नया आइटम" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("900×1200 px");
    await expect(dialog.getByLabel(/दाम/)).toHaveCount(0);
    await dialog.getByLabel("फोटो चुनें").setInputFiles(await pngFile(page, 1200, 1600));
    await expect(dialog.getByRole("img", { name: "फोटो का प्रीव्यू" })).toHaveAttribute("src", /^blob:/);
    await dialog.getByLabel("फोटो का शीर्षक").fill("मेहंदी रस्म");
    await dialog.getByLabel("श्रेणी").selectOption("events");
    await dialog.getByRole("button", { name: "सेव करें" }).click();
    await expect(page.getByText("नया आइटम जुड़ गया")).toBeVisible();
    expect(backend.catalog.find((r) => r.title === "मेहंदी रस्म")).toMatchObject({ kind: "studio_photo", category: "events", price: null, features: [] });
    expect(backend.storage.uploaded[0]).toMatch(/^catalog\/studio_photo\//);
  });

  test("hide, reorder, edit and delete", async ({ page, backend }) => {
    await page.goto("/admin/catalog");
    await page.getByRole("switch", { name: "Redmi Note 14 पेज पर दिखाएँ" }).click();
    await expect.poll(() => backend.catalog.find((r) => r.title === "Redmi Note 14")?.is_active).toBe(false);

    await page.getByRole("listitem").filter({ hasText: "boAt Airdopes 141" }).getByRole("button", { name: "ऊपर करें" }).click();
    await expect.poll(() => backend.catalog.find((r) => r.title === "boAt Airdopes 141")?.sort_order).toBe(10);
    expect(backend.catalog.find((r) => r.title === "Redmi Note 14")?.sort_order).toBe(20);

    await page.getByRole("button", { name: "boAt Airdopes 141 बदलें" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("प्रोडक्ट का नाम")).toHaveValue("boAt Airdopes 141");
    await dialog.getByLabel(/दाम/).fill("1299");
    await dialog.getByRole("button", { name: "सेव करें" }).click();
    await expect(page.getByText("बदलाव सेव हो गए")).toBeVisible();
    expect(backend.catalog.find((r) => r.title === "boAt Airdopes 141")?.price).toBe(1299);
    expect(backend.storage.uploaded).toHaveLength(0);

    backend.catalog.find((r) => r.title === "boAt Airdopes 141")!.image_path = "product/old.webp";
    await page.reload();
    await page.getByRole("button", { name: "boAt Airdopes 141 हटाएँ" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "हटाएँ" }).click();
    await expect(page.getByText("आइटम हटा दिया गया")).toBeVisible();
    expect(backend.catalog.find((r) => r.title === "boAt Airdopes 141")).toBeUndefined();
    expect(backend.storage.removed).toEqual(["catalog/product/old.webp"]);
  });

  test("readers cannot write to the catalog or upload", async ({ page, signInAs, backend }) => {
    await signInAs("reader");
    await page.goto("/admin/catalog");
    await expect(page.getByText("इस पेज के लिए एडमिन अनुमति चाहिए।")).toBeVisible();
    expect(backend.writes("catalog_items")).toHaveLength(0);
  });
});
