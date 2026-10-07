// SEO tags, PWA/offline, accessibility (axe), keyboard use, layout at small widths,
// dark mode and console-cleanliness across every public route.
import AxeBuilder from "@axe-core/playwright";
import { expect, noHorizontalScroll, test } from "./support/test";
import { readFileSync } from "node:fs";

const routes = JSON.parse(readFileSync(new URL("../config/public-routes.json", import.meta.url), "utf8")) as { routes: Array<{ path: string }> };

const PUBLIC = routes.routes.map((r) => r.path);

test.beforeEach(async ({ skipPreferenceSheet }) => skipPreferenceSheet());

test.describe("SEO", () => {
  test("post page: one canonical, post-specific OG tags and JobPosting JSON-LD", async ({ page }) => {
    await page.goto("/blog/rajasthan-police-constable-2026");
    await expect(page).toHaveTitle("राजस्थान पुलिस कांस्टेबल भर्ती 2026 — 9617 पद | मालाणी बाड़मेर");
    const canonicals = page.locator('link[rel="canonical"]');
    await expect(canonicals).toHaveCount(1);
    await expect(canonicals).toHaveAttribute("href", "https://malanibarmer.com/blog/rajasthan-police-constable-2026");
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /राजस्थान पुलिस कांस्टेबल/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index/);
    const types = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? "{}")["@type"]));
    expect(types).toEqual(expect.arrayContaining(["BreadcrumbList", "NewsArticle", "JobPosting"]));
    const job = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? "{}")).find((j) => j["@type"] === "JobPosting"));
    expect(job.validThrough).toMatch(/T23:59:59\+05:30$/);
    expect(job.hiringOrganization.name).toBe("राजस्थान पुलिस");
  });

  test("closed jobs do not advertise JobPosting", async ({ page }) => {
    await page.goto("/blog/patwari-2025-closed");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const types = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? "{}")["@type"]));
    expect(types).not.toContain("JobPosting");
  });

  test("private and search pages are noindex", async ({ page }) => {
    for (const path of ["/login", "/my", "/jobs?q=पुलिस", "/कोई-पेज-नहीं"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
  });

  test("every public route has a unique Hindi title, description and lang=hi", async ({ page }) => {
    const titles = new Set<string>();
    for (const path of PUBLIC) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect.poll(() => page.title()).not.toBe("");
      const title = await page.title();
      expect(titles.has(title), `duplicate title on ${path}: ${title}`).toBe(false);
      titles.add(title);
      await expect(page.locator('meta[name="description"]')).toHaveCount(1);
      expect(await page.locator("html").getAttribute("lang")).toMatch(/^hi/);
    }
  });
});

test.describe("PWA", () => {
  test.use({ serviceWorkers: "allow" });

  test("manifest is valid and installable", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="manifest"]'), "exactly one manifest link").toHaveCount(1);
    const href = await page.locator('link[rel="manifest"]').getAttribute("href");
    const manifest = await (await request.get(href!)).json();
    expect(manifest).toMatchObject({ lang: "hi", display: "standalone", start_url: "/?source=pwa", theme_color: "#1E3A8A" });
    expect(manifest.icons.map((i: { sizes: string; purpose: string }) => `${i.sizes}:${i.purpose}`)).toEqual(expect.arrayContaining(["192x192:any", "512x512:any", "512x512:maskable"]));
    for (const icon of manifest.icons) expect((await request.get(icon.src)).status()).toBe(200);
  });

  test("service worker caches the app shell so pages open offline", async ({ page, context }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await context.setOffline(true);
    await page.goto("/quiz");
    await expect(page.getByRole("heading", { level: 1, name: "डेली GK क्विज़" })).toBeVisible();
    await context.setOffline(false);
  });
});

test.describe("Accessibility", () => {
  for (const path of ["/", "/jobs", "/blog/rajasthan-police-constable-2026", "/quiz", "/login", "/my", "/services", "/today"]) {
    test(`no serious axe violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")})`)).toEqual([]);
    });
  }

  for (const path of ["/", "/jobs", "/blog/rajasthan-police-constable-2026", "/services"]) {
    test(`no serious axe violations in dark mode on ${path}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });
  }

  test("keyboard: skip link reaches main content; Escape closes sheets", async ({ page }) => {
    await page.goto("/jobs");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "मुख्य सामग्री पर जाएँ" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
    await page.getByRole("button", { name: /^फ़िल्टर/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("tap targets on job cards are at least 40px", async ({ page }) => {
    await page.goto("/jobs");
    const card = page.getByRole("article").first();
    for (const name of ["सेव करें", "WhatsApp पर शेयर करें"]) {
      const box = await card.getByRole(name === "सेव करें" ? "button" : "link", { name }).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(40);
      expect(box!.height).toBeGreaterThanOrEqual(40);
    }
  });
});

test.describe("Layout and theming", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("no sideways scrolling at 360px on any public page", async ({ page }) => {
    for (const path of [...PUBLIC, "/blog/rajasthan-police-constable-2026", "/my", "/login"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await noHorizontalScroll(page);
    }
  });

  test("dark mode follows the phone and has a dark background", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const [r, g, b] = bg.match(/\d+/g)!.map(Number);
    expect(r + g + b).toBeLessThan(120);
  });

  test("mobile bottom navigation highlights the current section", async ({ page }) => {
    await page.goto("/jobs");
    const nav = page.getByRole("navigation", { name: "नीचे का नेविगेशन" });
    await expect(nav.getByRole("link", { name: "नौकरियाँ" })).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "सेव" }).click();
    await expect(page).toHaveURL(/\/my$/);
    await expect(nav.getByRole("link", { name: "सेव" })).toHaveAttribute("aria-current", "page");
  });
});

test("contact form sends an enquiry through EmailJS", async ({ page, backend }) => {
  await page.goto("/services");
  const form = page.locator("form").filter({ has: page.locator("#c-name") });
  await form.scrollIntoViewIfNeeded();
  await page.waitForTimeout(3100); // bots submit instantly; the form requires a human-like pause
  await page.locator("#c-name").fill("राम");
  await page.locator("#c-phone").fill("9876543210");
  await page.locator("#c-service").fill("जाति प्रमाण पत्र");
  await page.locator("#c-message").fill("कौनसे दस्तावेज़ लाने हैं?");
  await form.getByRole("button", { name: /भेजें|Send/i }).click();
  await expect.poll(() => backend.emails.length).toBe(1);
  expect(backend.emails[0].template_params).toMatchObject({ name: "राम", phone: "9876543210" });
  expect(backend.emails[0].template_params.website).toBeUndefined();
});

test("newsletter signup requires consent and shows the confirmation step", async ({ page, backend }) => {
  await page.goto("/");
  const section = page.getByRole("region", { name: /ईमेल पर हफ़्ते की नौकरियाँ/ });
  await section.getByRole("textbox", { name: "ईमेल" }).fill("reader@example.test");
  await section.getByRole("button", { name: /सब्सक्राइब/ }).click();
  await expect(page.getByText("कृपया सहमति वाले बॉक्स पर टिक करें।")).toBeVisible();
  await section.getByRole("checkbox").click();
  await section.getByRole("button", { name: /सब्सक्राइब/ }).click();
  await expect(section.getByRole("status")).toContainText("पुष्टि लिंक");
  expect(backend.find((c) => c.path === "/functions/v1/newsletter")[0].body).toMatchObject({ action: "subscribe", email: "reader@example.test", consent: true });
});
