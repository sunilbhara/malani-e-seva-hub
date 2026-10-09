import { expect, noHorizontalScroll, test } from "./support/test";
import { TEST_USERS } from "./support/data";

test.describe("Home", () => {
  test("first visit: search-first hero, closing-soon, today's updates, services; no preference sheet", async ({ page, backend }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("सरकारी नौकरी");
    await expect(page.getByRole("link", { name: "राजस्थान पुलिस कांस्टेबल भर्ती 2026 — 9617 पद" }).first()).toBeVisible();
    // "आज की अपडेट" when something was published today (IST), otherwise "ताज़ा अपडेट".
    await expect(page.getByRole("main").getByRole("heading", { name: /आज की अपडेट|ताज़ा अपडेट/ })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText("ड्राफ्ट — पाठकों को नहीं दिखना चाहिए")).toHaveCount(0);
    expect(backend.rpcCalls("list_posts").length).toBeGreaterThan(0);
    await noHorizontalScroll(page);
  });

  test("the 3 questions open from the home card and personalise the feed", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "शुरू करें" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toContainText("3 सवाल");
    await sheet.getByRole("button", { name: "12वीं पास" }).click();
    await sheet.getByRole("button", { name: "पुलिस" }).click();
    await sheet.getByRole("button", { name: "मेरी नौकरियाँ दिखाएँ" }).click();
    await expect(sheet).toHaveCount(0);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "आपके लिए" })).toBeVisible();
    await expect(page.getByText("12वीं पास · पुलिस")).toBeVisible();
  });

  test("no preferences popup interrupts later page views", async ({ page }) => {
    await page.goto("/");
    await page.goto("/jobs");
    await page.goto("/result");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("shop strip shows the three businesses with real photos and links to them", async ({ page, skipPreferenceSheet }) => {
    await skipPreferenceSheet();
    await page.goto("/");
    const strip = page.getByRole("region", { name: "हमारी दुकान — बाड़मेर" });
    for (const [name, href] of [["ई-मित्र सेवाएँ", "/services"], ["मोबाइल और एक्सेसरीज़", "/mobile-electronics"], ["माताजी स्टूडियो", "/mataji-studio"]] as const) {
      await expect(strip.getByRole("link", { name: new RegExp(name) })).toHaveAttribute("href", href);
    }
    await expect(strip.getByRole("img").first()).toHaveAttribute("src", /\/shop\/.+\.webp$/);
    await strip.getByRole("link", { name: /माताजी स्टूडियो/ }).click();
    await expect(page).toHaveURL(/\/mataji-studio$/);
    // The bottom navigation exists on phones only.
    if (await page.getByRole("navigation", { name: "नीचे का नेविगेशन" }).isVisible()) {
      await expect(page.getByRole("navigation", { name: "नीचे का नेविगेशन" }).getByRole("link", { name: "सेवाएँ" })).toHaveAttribute("aria-current", "page");
    }
  });

  test("home search goes to the jobs listing with the query", async ({ page, skipPreferenceSheet }) => {
    await skipPreferenceSheet();
    await page.goto("/");
    await page.getByRole("main").getByRole("searchbox").first().fill("पुलिस");
    await page.getByRole("main").getByRole("searchbox").first().press("Enter");
    await expect(page).toHaveURL(/\/jobs\?q=/);
    await expect(page.getByRole("link", { name: /राजस्थान पुलिस कांस्टेबल भर्ती/ })).toBeVisible();
  });
});

test.describe("Jobs listing", () => {
  test.beforeEach(async ({ skipPreferenceSheet }) => skipPreferenceSheet());

  test("lists open, closing and closed jobs with correct badges; no drafts", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { level: 1, name: "सरकारी नौकरियाँ" })).toBeVisible();
    await expect(page.getByText(/^2\d भर्तियाँ$/)).toBeVisible();
    const police = page.getByRole("article").filter({ hasText: "राजस्थान पुलिस कांस्टेबल भर्ती" });
    await expect(police.getByText("अंतिम तिथि नज़दीक")).toBeVisible();
    await expect(police.getByText("3 दिन बचे")).toBeVisible();
    await expect(page.getByText("ड्राफ्ट — पाठकों को नहीं दिखना चाहिए")).toHaveCount(0);
  });

  test("status chips, search and filter sheet update results and the URL", async ({ page }) => {
    await page.goto("/jobs");
    await page.getByRole("button", { name: "अंतिम तिथि नज़दीक" }).click();
    await expect(page).toHaveURL(/status=closing/);
    await expect(page.getByRole("article")).toHaveCount(1);

    await page.getByRole("button", { name: "सभी" }).click();
    await page.getByRole("searchbox", { name: "खोजें" }).fill("SBI");
    await page.getByRole("searchbox", { name: "खोजें" }).press("Enter");
    await expect(page).toHaveURL(/q=SBI/);
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "SBI क्लर्क भर्ती 2026 — 5000 पद" })).toBeVisible();

    await page.goto("/jobs");
    await page.getByRole("button", { name: /^फ़िल्टर/ }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "12वीं पास" }).click();
    await expect(sheet.getByRole("button", { name: /दिखाएँ \(\d+\)/ })).toBeVisible();
    await sheet.getByRole("button", { name: /दिखाएँ/ }).click();
    await expect(page).toHaveURL(/qualification=12th/);
    await expect(page.getByRole("button", { name: "12वीं पास हटाएँ" })).toBeVisible();
  });

  test("filtered URLs are shareable and survive reload", async ({ page }) => {
    await page.goto("/jobs?status=closed");
    await expect(page.getByRole("link", { name: "पटवारी भर्ती 2025 — आवेदन बंद" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "आवेदन बंद" })).toHaveCount(0);
    await expect(page.getByRole("article")).toHaveCount(1);
  });

  test("loads more results on scroll (infinite list)", async ({ page, backend }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("article")).toHaveCount(20);
    await page.getByRole("article").last().scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 5_000);
    await expect.poll(async () => page.getByRole("article").count()).toBeGreaterThan(20);
    expect(backend.rpcCalls("list_posts").some((c) => c.body.p_offset === 20)).toBe(true);
    await expect(page.getByRole("button", { name: "और देखें" })).toHaveCount(0);
  });

  test("no results offers to clear filters", async ({ page }) => {
    await page.goto("/jobs?q=कोई-नहीं-मिलेगा");
    await expect(page.getByText("कोई नतीजा नहीं मिला")).toBeVisible();
    await page.getByRole("button", { name: "फ़िल्टर हटाएँ" }).click();
    await expect(page).toHaveURL(/\/jobs$/);
  });

  test("backend outage shows a retry", async ({ page, backend }) => {
    backend.failures["rpc/list_posts"] = 503;
    await page.goto("/jobs");
    await expect(page.getByText("अपडेट लोड नहीं हो सकीं")).toBeVisible({ timeout: 15_000 });
    delete backend.failures["rpc/list_posts"];
    await page.getByRole("button", { name: "दोबारा कोशिश करें" }).click();
    await expect(page.getByRole("article").first()).toBeVisible();
  });

  test("admit card and result tabs switch listings", async ({ page }) => {
    await page.goto("/result");
    await expect(page.getByRole("link", { name: "पटवारी परीक्षा रिजल्ट घोषित" })).toBeVisible();
    await expect(page.getByRole("link", { name: "RPSC परीक्षा कैलेंडर 2026" })).toBeVisible();
    await page.getByRole("navigation", { name: "अपडेट का प्रकार" }).getByRole("link", { name: "एडमिट कार्ड" }).click();
    await expect(page).toHaveURL(/\/admit-card$/);
    await expect(page.getByRole("link", { name: "राजस्थान पुलिस कांस्टेबल एडमिट कार्ड जारी" })).toBeVisible();
  });
});

test.describe("Post page", () => {
  test.beforeEach(async ({ skipPreferenceSheet }) => skipPreferenceSheet());
  const URL = "/blog/rajasthan-police-constable-2026";

  test("shows facts, dates, fees, verified source and safe external links", async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("राजस्थान पुलिस कांस्टेबल भर्ती 2026 — 9617 पद");
    await expect(page.getByText("9,617").first()).toBeVisible();
    await expect(page.getByText("आधिकारिक स्रोत से सत्यापित")).toBeVisible();
    await expect(page.getByRole("heading", { name: "महत्वपूर्ण तिथियाँ" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "₹600" })).toBeVisible();
    const apply = page.getByRole("link", { name: /आवेदन करें/ });
    await expect(apply).toHaveAttribute("href", "https://police.rajasthan.gov.in/apply");
    await expect(apply).toHaveAttribute("target", "_blank");
    await expect(apply).toHaveAttribute("rel", /noopener/);
    await noHorizontalScroll(page);
  });

  test("records exactly one view per visit", async ({ page, backend }) => {
    await page.goto(URL);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect.poll(() => backend.rpcCalls("record_post_view").length).toBe(1);
    await page.getByRole("button", { name: "अक्षर आकार 3" }).click();
    expect(backend.rpcCalls("record_post_view")).toHaveLength(1);
  });

  test("table of contents jumps to sections", async ({ page }) => {
    await page.goto(URL);
    const toc = page.getByRole("navigation", { name: /विषय-सूची/ }).filter({ visible: true }).first();
    if (await toc.count()) {
      await toc.getByRole("link", { name: "योग्यता" }).click();
    } else {
      await page.getByRole("button", { name: "विषय-सूची" }).click();
      await page.getByRole("dialog").getByRole("link", { name: "योग्यता" }).click();
    }
    await expect(page).toHaveURL(/#section-2$/);
    await expect(page.locator("#section-2")).toBeInViewport();
  });

  test("guest save shows up in My Jobs, and can be removed", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /^सेव/ }).first().click();
    await expect(page.getByText("सेव हो गया — मेरी नौकरियाँ में देखें")).toBeVisible();
    await page.goto("/my");
    await expect(page.getByRole("link", { name: "राजस्थान पुलिस कांस्टेबल भर्ती 2026 — 9617 पद" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /सेव/ })).toContainText("(1)");
    await page.getByRole("button", { name: "सेव से हटाएँ" }).click();
    await expect(page.getByText("अभी कोई सेव नहीं")).toBeVisible();
  });

  test("reminder without push downloads a calendar file", async ({ page }) => {
    await page.goto(URL);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "मुझे याद दिलाएँ" }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe("rajasthan-police-constable-2026-reminder.ics");
    const ics = await (await file.createReadStream()).toArray();
    expect(Buffer.concat(ics).toString()).toContain("BEGIN:VEVENT");
  });

  test("status image uses the phone's share sheet when available", async ({ page, context, backend }) => {
    await context.addInitScript(() => {
      (window as unknown as { __shared: unknown[] }).__shared = [];
      Object.defineProperty(navigator, "canShare", { value: () => true, configurable: true });
      Object.defineProperty(navigator, "share", {
        value: async (data: ShareData) => {
          (window as unknown as { __shared: unknown[] }).__shared.push({ files: data.files?.map((f) => [f.name, f.type, f.size]) });
        },
        configurable: true,
      });
    });
    await page.goto(URL);
    await page.getByRole("button", { name: "शेयर करें" }).click();
    await page.getByRole("dialog").getByRole("button", { name: /स्टेटस फोटो/ }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __shared: Array<{ files: Array<[string, string, number]> }> }).__shared.length)).toBe(1);
    const [shared] = await page.evaluate(() => (window as unknown as { __shared: Array<{ files: Array<[string, string, number]> }> }).__shared);
    expect(shared.files[0][0]).toBe("rajasthan-police-constable-2026-status.png");
    expect(shared.files[0][1]).toBe("image/png");
    expect(shared.files[0][2]).toBeGreaterThan(10_000);
    await expect.poll(() => backend.rpcCalls("record_post_share").length).toBe(1);
  });

  test("share sheet: WhatsApp text, Telegram, copy link and status image", async ({ page, backend, context, browserName }) => {
    // Desktop browsers without file sharing download the image instead.
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "canShare", { value: undefined, configurable: true });
    });
    await page.goto(URL);
    await page.getByRole("button", { name: "शेयर करें" }).click();
    const sheet = page.getByRole("dialog");
    const wa = await sheet.getByRole("link", { name: /WhatsApp पर भेजें/ }).getAttribute("href");
    expect(decodeURIComponent(wa!)).toContain("9,617 पद");
    expect(decodeURIComponent(wa!)).toContain("utm_source=whatsapp");
    expect(await sheet.getByRole("link", { name: /Telegram/ }).getAttribute("href")).toMatch(/^https:\/\/t\.me\/share\/url/);

    if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await sheet.getByRole("button", { name: /लिंक कॉपी/ }).click();
    await expect(page.getByText(/लिंक कॉपी हो गया|लिंक कॉपी नहीं हो सका/)).toBeVisible();

    // Copying keeps the sheet open; reopen only if it closed.
    if (!(await page.getByRole("dialog").isVisible())) await page.getByRole("button", { name: "शेयर करें" }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("dialog").getByRole("button", { name: /स्टेटस फोटो/ }).click();
    expect((await download).suggestedFilename()).toBe("rajasthan-police-constable-2026-status.png");
    await expect.poll(() => backend.rpcCalls("record_post_share").length).toBeGreaterThan(0);
  });

  test("like and Q&A ask guests to sign in and come back", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /उपयोगी/ }).click();
    await expect(page).toHaveURL(/\/login\?redirect=%2Fblog%2Frajasthan-police-constable-2026$/);
  });

  test("old id links redirect to the slug", async ({ page }) => {
    await page.goto("/blog/e2e10000-0000-4000-8000-000000000001");
    await expect(page).toHaveURL(/\/blog\/rajasthan-police-constable-2026$/);
  });

  test("drafts are not visible to readers", async ({ page }) => {
    await page.goto("/blog/secret-draft");
    await expect(page.getByRole("heading", { level: 1, name: "पोस्ट नहीं मिली" })).toBeVisible();
  });

  test("article without job details has no apply/reminder actions", async ({ page }) => {
    await page.goto("/blog/jan-aadhaar-guide");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("जन आधार कार्ड कैसे बनवाएँ — ई-मित्र गाइड");
    await expect(page.getByRole("link", { name: /आवेदन करें/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "मुझे याद दिलाएँ" })).toHaveCount(0);
  });
});

test.describe("Today and quiz", () => {
  test.beforeEach(async ({ skipPreferenceSheet }) => skipPreferenceSheet());

  test("today's page lists today's updates and closing-soon", async ({ page }) => {
    await page.goto("/today");
    await expect(page.getByRole("heading", { level: 1, name: "आज की अपडेट" })).toBeVisible();
    await expect(page.getByRole("link", { name: "SBI क्लर्क भर्ती 2026 — 5000 पद" })).toBeVisible();
    await expect(page.getByText("⏰ अंतिम तिथि नज़दीक")).toBeVisible();
  });

  test("quiz: answer, submit, see score and explanations; streak persists after reload", async ({ page, backend }) => {
    await page.goto("/quiz");
    const submit = page.getByRole("button", { name: "सभी 2 सवालों के जवाब चुनें" });
    await expect(submit).toBeDisabled();
    await page.getByText("जयपुर", { exact: true }).click();
    await page.getByText("उत्तर", { exact: true }).click();
    await page.getByRole("button", { name: "जवाब जमा करें" }).click();
    await expect(page.getByRole("status").filter({ hasText: "आपका स्कोर" })).toContainText("1/2");
    await expect(page.getByText("💡 जयपुर 1949 से राजस्थान की राजधानी है।")).toBeVisible();
    expect(backend.rpcCalls("submit_quiz")[0].body.p_answers).toEqual([1, 0]);
    await page.reload();
    await expect(page.getByLabel("1 दिन की स्ट्रीक")).toBeVisible();
  });
});

test.describe("Static pages and 404", () => {
  test.beforeEach(async ({ skipPreferenceSheet }) => skipPreferenceSheet());

  for (const [path, heading] of [
    ["/services", /ई-मित्र/],
    ["/mobile-electronics", /मोबाइल/],
    ["/mataji-studio", /फोटोग्राफ/],
    ["/about", "हमारे बारे में"],
    ["/contact", "संपर्क करें"],
    ["/disclaimer", "अस्वीकरण (Disclaimer)"],
    ["/privacy-policy", "प्राइवेसी पॉलिसी"],
    ["/terms", "नियम और शर्तें"],
  ] as const) {
    test(`${path} renders`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
      await noHorizontalScroll(page);
    });
  }

  test("unknown URL shows 404 with a way home", async ({ page }) => {
    await page.goto("/कुछ-भी-नहीं");
    await expect(page.getByRole("heading", { level: 1, name: "यह पेज नहीं मिला" })).toBeVisible();
  });

  test("services page: WhatsApp and call links point to the shop", async ({ page }) => {
    await page.goto("/services");
    await expect(page.getByRole("link", { name: /WhatsApp/ }).first()).toHaveAttribute("href", /^https:\/\/wa\.me\/919950788973/);
    await expect(page.locator('a[href^="tel:+919950788973"]').first()).toBeVisible();
  });
});

void TEST_USERS;
