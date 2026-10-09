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

const REDMI = "e2e40000-0000-4000-8000-000000000001";
const BOAT = "e2e40000-0000-4000-8000-000000000002";
const OFFER = "e2e48000-0000-4000-8000-000000000001";

test.describe("Shop pages (reader)", () => {
  test.beforeEach(async ({ skipPreferenceSheet }) => skipPreferenceSheet());

  test("products: e-commerce grid with collections, price cut and hidden items excluded", async ({ page }) => {
    await page.goto("/mobile-electronics");
    const shop = page.getByRole("region", { name: "मालानी मोबाइल और इलेक्ट्रॉनिक्स" });
    // Active collection becomes a section; the hidden collection and hidden product never show.
    const offer = shop.getByRole("region", { name: "त्योहार ऑफ़र" });
    await expect(offer.getByRole("heading", { name: "Redmi Note 14" })).toBeVisible();
    await expect(shop.getByText("छुपा कलेक्शन")).toHaveCount(0);
    await expect(page.getByText("पुराना मॉडल (छुपा)")).toHaveCount(0);
    // Price cut: selling price, struck MRP and discount.
    await expect(offer.getByText("₹17,999")).toBeVisible();
    await expect(offer.getByText("₹21,999")).toHaveCSS("text-decoration-line", "line-through");
    await expect(offer.getByText("18% छूट").first()).toBeVisible();
    await expect(shop.getByRole("heading", { name: "सभी प्रोडक्ट (2)" })).toBeVisible();
    await expect(shop.getByText("दाम के लिए पूछें").first()).toBeVisible();

    // Filters: collections first, then categories that have products.
    const filters = shop.getByRole("group", { name: "प्रोडक्ट फ़िल्टर" });
    await expect(filters.getByRole("button")).toHaveText(["सभी", "त्योहार ऑफ़र", "मोबाइल", "एक्सेसरीज़"]);
    await filters.getByRole("button", { name: "एक्सेसरीज़" }).click();
    await expect(shop.getByRole("heading", { name: "boAt Airdopes 141" })).toBeVisible();
    await expect(shop.getByRole("heading", { name: "Redmi Note 14" })).toHaveCount(0);

    // Sorting by price puts unpriced items last.
    await filters.getByRole("button", { name: "सभी" }).click();
    await shop.getByLabel("क्रम").selectOption("price-asc");
    await expect(shop.getByRole("listitem").getByRole("heading")).toHaveText(["Redmi Note 14", "boAt Airdopes 141"]);

    // Detail view with WhatsApp ordering.
    await shop.getByRole("button", { name: "Redmi Note 14 — पूरी जानकारी" }).click();
    const detail = page.getByRole("dialog", { name: "Redmi Note 14" });
    await expect(detail.getByText("5110mAh बैटरी")).toBeVisible();
    await expect(detail.getByRole("link", { name: /WhatsApp पर ऑर्डर/ })).toHaveAttribute("href", /wa\.me\/.*Redmi/);
  });

  test("studio photos: grid with a viewer that steps through photos", async ({ page }) => {
    await page.goto("/mataji-studio");
    const grid = page.getByRole("list", { name: "स्टूडियो फोटो" });
    await expect(grid.getByRole("listitem")).toHaveCount(2);
    await grid.getByRole("button", { name: "शादी के पल — बड़ी फोटो देखें" }).click();
    const viewer = page.getByRole("dialog");
    await expect(viewer.getByRole("img", { name: "शादी के पल" })).toBeVisible();
    await expect(viewer).toContainText("1/2");
    await viewer.getByRole("button", { name: "अगली फोटो" }).click();
    await expect(viewer.getByRole("img", { name: "फैमिली पोर्ट्रेट" })).toBeVisible();
    await expect(viewer).toContainText("2/2");
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

  test("add a product with photo, MRP and a collection: resized, uploaded, saved and shown", async ({ page, backend }) => {
    await page.goto("/admin/catalog");
    await expect(page.getByRole("heading", { name: "दुकान के आइटम" })).toBeVisible();
    await expect(page.getByText("पुराना मॉडल (छुपा)")).toBeVisible();

    await page.getByRole("button", { name: "नया प्रोडक्ट" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("800×800 px");
    await dialog.getByRole("button", { name: "सेव करें" }).click();
    await expect(page.getByText("फोटो चुनें।")).toBeVisible();

    await dialog.getByLabel("फोटो चुनें").setInputFiles(await pngFile(page, 1600, 1000));
    await expect(dialog.getByRole("img", { name: "फोटो का प्रीव्यू" })).toHaveAttribute("src", /^blob:/);
    await dialog.getByLabel("प्रोडक्ट का नाम").fill("Vivo Y29 5G");
    await dialog.getByLabel("श्रेणी").selectOption("mobiles");
    await dialog.getByLabel("बिक्री का दाम (₹)").fill("₹13,999");
    await dialog.getByLabel(/MRP/).fill("15999");
    await expect(dialog.getByText("पेज पर दिखेगा: MRP कटी हुई और “13% छूट”।")).toBeVisible();
    await dialog.getByLabel(/खूबियाँ/).fill("6000mAh बैटरी\n\n120Hz डिस्प्ले");
    await dialog.getByRole("checkbox", { name: "त्योहार ऑफ़र" }).check();
    await dialog.getByRole("button", { name: "सेव करें" }).click();
    await expect(page.getByText("नया आइटम जुड़ गया")).toBeVisible();

    expect(backend.storage.uploaded).toHaveLength(1);
    expect(backend.storage.uploaded[0]).toMatch(/^catalog\/product\/[0-9a-f-]{36}\.(webp|jpg)$/);
    const saved = backend.catalog.find((r) => r.title === "Vivo Y29 5G")!;
    expect(saved).toMatchObject({ kind: "product", category: "mobiles", price: 13999, mrp: 15999, features: ["6000mAh बैटरी", "120Hz डिस्प्ले"], is_active: true, sort_order: 40 });
    expect(backend.collectionItems.some((l) => l.collection_id === OFFER && l.item_id === saved.id)).toBe(true);

    await page.goto("/mobile-electronics");
    const offer = page.getByRole("region", { name: "त्योहार ऑफ़र" });
    await expect(offer.getByRole("heading", { name: "Vivo Y29 5G" })).toBeVisible();
    await expect(offer.getByText("13% छूट").first()).toBeVisible();
  });

  test("rejects photos that are too small, bad prices and an MRP below the price", async ({ page, backend }) => {
    await page.goto("/admin/catalog");
    await page.getByRole("button", { name: "नया प्रोडक्ट" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("फोटो चुनें").setInputFiles(await pngFile(page, 400, 400));
    await expect(page.getByText(/फोटो बहुत छोटी है \(400×400\)/)).toBeVisible();
    await dialog.getByLabel("फोटो चुनें").setInputFiles(await pngFile(page, 900, 900));
    await dialog.getByLabel("प्रोडक्ट का नाम").fill("Test");
    await dialog.getByLabel("बिक्री का दाम (₹)").fill("12k");
    await dialog.getByRole("button", { name: "सेव करें" }).click();
    await expect(page.getByText("दाम सिर्फ़ रुपये में अंकों में लिखें, जैसे 79999।")).toBeVisible();
    await dialog.getByLabel("बिक्री का दाम (₹)").fill("1200");
    await dialog.getByLabel(/MRP/).fill("1000");
    await dialog.getByRole("button", { name: "सेव करें" }).click();
    await expect(page.getByText("MRP बिक्री के दाम से कम नहीं हो सकती।")).toBeVisible();
    expect(backend.storage.uploaded).toHaveLength(0);
    expect(backend.writes("catalog_items")).toHaveLength(0);
  });

  test("studio photo keeps its shape and has no price fields", async ({ page, backend }) => {
    await page.goto("/admin/catalog");
    await page.getByRole("tab", { name: "स्टूडियो फोटो" }).click();
    await expect(page.getByText("फैमिली पोर्ट्रेट")).toBeVisible();
    await page.getByRole("button", { name: "नई फोटो" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("फोटो जैसी है वैसी रहेगी (खड़ी या आड़ी)");
    await expect(dialog.getByLabel(/दाम/)).toHaveCount(0);
    await expect(dialog.getByLabel(/MRP/)).toHaveCount(0);
    await dialog.getByLabel("फोटो चुनें").setInputFiles(await pngFile(page, 1200, 1600));
    await expect(dialog.getByRole("img", { name: "फोटो का प्रीव्यू" })).toHaveAttribute("src", /^blob:/);
    await dialog.getByLabel("फोटो का शीर्षक").fill("मेहंदी रस्म");
    await dialog.getByLabel("श्रेणी").selectOption("events");
    await dialog.getByRole("button", { name: "सेव करें" }).click();
    await expect(page.getByText("नया आइटम जुड़ गया")).toBeVisible();
    expect(backend.catalog.find((r) => r.title === "मेहंदी रस्म")).toMatchObject({ kind: "studio_photo", category: "events", price: null, features: [] });
    expect(backend.storage.uploaded[0]).toMatch(/^catalog\/studio_photo\//);
  });

  test("hide, reorder, edit and delete products", async ({ page, backend }) => {
    await page.goto("/admin/catalog");
    await page.getByRole("switch", { name: "Redmi Note 14 पेज पर दिखाएँ" }).click();
    await expect.poll(() => backend.catalog.find((r) => r.title === "Redmi Note 14")?.is_active).toBe(false);

    await page.getByRole("listitem").filter({ hasText: "boAt Airdopes 141" }).getByRole("button", { name: "ऊपर करें" }).click();
    await expect.poll(() => backend.catalog.find((r) => r.title === "boAt Airdopes 141")?.sort_order).toBe(10);
    expect(backend.catalog.find((r) => r.title === "Redmi Note 14")?.sort_order).toBe(20);

    await page.getByRole("button", { name: "boAt Airdopes 141 बदलें" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("प्रोडक्ट का नाम")).toHaveValue("boAt Airdopes 141");
    await dialog.getByLabel("बिक्री का दाम (₹)").fill("1299");
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

  test("collections: create with products, edit, hide and delete (products stay)", async ({ page, backend }) => {
    await page.goto("/admin/catalog");
    await page.getByRole("tab", { name: "कलेक्शन" }).click();
    await expect(page.getByText("त्योहार ऑफ़र")).toBeVisible();
    await expect(page.getByText("छुपा कलेक्शन")).toBeVisible();

    await page.getByRole("button", { name: "नया कलेक्शन" }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "सेव करें" }).click();
    await expect(page.getByText("कलेक्शन का नाम लिखें।")).toBeVisible();
    await dialog.getByLabel("कलेक्शन का नाम").fill("₹2000 से कम");
    await dialog.getByRole("checkbox", { name: "boAt Airdopes 141" }).check();
    await dialog.getByRole("checkbox", { name: "Redmi Note 14" }).check();
    await expect(dialog).toContainText("(2 चुने गए)");
    await dialog.getByRole("button", { name: "सेव करें" }).click();
    await expect(page.getByText("नया कलेक्शन बन गया")).toBeVisible();
    const created = backend.collections.find((c) => c.title === "₹2000 से कम")!;
    expect(backend.collectionItems.filter((l) => l.collection_id === created.id).map((l) => l.item_id)).toEqual([BOAT, REDMI]);

    await page.getByRole("button", { name: "त्योहार ऑफ़र बदलें" }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByRole("checkbox", { name: "Redmi Note 14" }).uncheck();
    await dialog.getByRole("button", { name: "सेव करें" }).click();
    await expect(page.getByText("कलेक्शन सेव हो गया")).toBeVisible();
    expect(backend.collectionItems.some((l) => l.collection_id === OFFER && l.item_id === REDMI)).toBe(false);

    await page.getByRole("switch", { name: "त्योहार ऑफ़र पेज पर दिखाएँ" }).click();
    await expect.poll(() => backend.collections.find((c) => c.id === OFFER)?.is_active).toBe(false);

    await page.getByRole("button", { name: "त्योहार ऑफ़र हटाएँ" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "हटाएँ" }).click();
    await expect(page.getByText(/कलेक्शन हटा दिया गया/)).toBeVisible();
    expect(backend.collections.find((c) => c.id === OFFER)).toBeUndefined();
    expect(backend.catalog.some((i) => i.id === REDMI)).toBe(true);
  });

  test("readers cannot open the catalog admin", async ({ page, signInAs, backend }) => {
    await signInAs("reader");
    await page.goto("/admin/catalog");
    await expect(page.getByText("इस पेज के लिए एडमिन अनुमति चाहिए।")).toBeVisible();
    expect(backend.writes("catalog_items")).toHaveLength(0);
    expect(backend.writes("catalog_collections")).toHaveLength(0);
  });
});
