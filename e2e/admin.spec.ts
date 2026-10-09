import { expect, test } from "./support/test";
import { day, istToday } from "./support/data";

test.beforeEach(async ({ signInAs, skipPreferenceSheet }) => {
  await skipPreferenceSheet();
  await signInAs("admin");
});

test("dashboard shows analytics", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "डैशबोर्ड" })).toBeVisible();
  await expect(page.getByText("4,321")).toBeVisible();
  await expect(page.getByText("कुल व्यूज़")).toBeVisible();
  await expect(page.getByRole("link", { name: "नई पोस्ट लिखें" })).toBeVisible();
});

test("editor blocks invalid posts", async ({ page, backend }) => {
  await page.goto("/admin/posts/new");
  await page.getByRole("button", { name: "प्रकाशित करें", exact: true }).click();
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("शीर्षक लिखें।");
  await expect(alert).toContainText("भर्ती का विभाग/संस्था लिखें।");
  await page.getByLabel("शीर्षक", { exact: true }).fill("RPSC भर्ती");
  await page.getByLabel("विभाग / संस्था *").fill("RPSC");
  await page.getByLabel("ऑनलाइन आवेदन लिंक").fill("javascript:alert(1)");
  await page.getByRole("button", { name: "प्रकाशित करें", exact: true }).click();
  await expect(alert).toContainText("आवेदन लिंक: केवल https:// वाला लिंक डालें।");
  expect(backend.writes("posts")).toHaveLength(0);
});

test("create and publish a job post with the real rich-text editor", async ({ page, backend }) => {
  await page.goto("/admin/posts/new");
  await page.getByLabel("शीर्षक", { exact: true }).fill("RSMSSB पटवारी भर्ती 2026 — 2020 पद");
  await page.getByLabel("विभाग / संस्था *").fill("RSMSSB");
  await page.getByLabel("कुल पद").fill("2020");
  await page.getByRole("button", { name: "ग्रेजुएट", exact: true }).click();
  await page.getByRole("button", { name: "पटवारी", exact: true }).click();
  await page.getByLabel("अंतिम तिथि", { exact: true }).fill(day(25));
  await page.getByLabel("ऑनलाइन आवेदन लिंक").fill("https://rsmssb.rajasthan.gov.in/apply");

  const editor = page.locator(".ProseMirror").first();
  await editor.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.type("आवेदन से पहले अधिसूचना ज़रूर पढ़ें।");

  await page.getByRole("button", { name: "प्रकाशित करें", exact: true }).click();
  await expect(page.getByText("पोस्ट प्रकाशित हो गई").first()).toBeVisible();
  const share = page.getByRole("dialog", { name: "पोस्ट प्रकाशित हो गई — अब शेयर करें" });
  await expect(share.getByRole("link", { name: /WhatsApp पर शेयर करें/ })).toHaveAttribute("href", /wa\.me/);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/admin\/posts\/e2e19999-/);

  const insert = backend.writes("posts", "POST")[0];
  expect(insert.body).toMatchObject({ title: "RSMSSB पटवारी भर्ती 2026 — 2020 पद", status: "draft", post_type: "job" });
  expect(insert.body.slug).toMatch(/^rsmssb-[a-z0-9-]+-2020/);
  expect(insert.body.content).toContain("आवेदन से पहले अधिसूचना ज़रूर पढ़ें।");
  const job = backend.writes("job_details", "POST")[0];
  expect(job.body).toMatchObject({ organisation: "RSMSSB", total_posts: 2020, qualifications: ["graduate"], departments: ["patwari"], last_date: day(25) });
  const publish = backend.writes("posts", "PATCH").at(-1)!;
  expect(publish.body).toEqual({ status: "published" });

  // The new post is now public.
  await page.goto("/jobs?q=पटवारी%20भर्ती%202026");
  await expect(page.getByRole("link", { name: "RSMSSB पटवारी भर्ती 2026 — 2020 पद" })).toBeVisible();
});

test("AI draft fills the form from pasted notification text", async ({ page }) => {
  await page.goto("/admin/posts/new");
  await page.getByRole("button", { name: /AI से ड्राफ़्ट/ }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByPlaceholder("भर्ती की पूरी जानकारी यहाँ पेस्ट करें…").fill("RPSC Lecturer recruitment 2026, 500 posts, last date ...");
  await sheet.getByRole("button", { name: /ड्राफ़्ट बनाएँ/ }).click();
  await expect(page.getByLabel("शीर्षक", { exact: true })).toHaveValue("RPSC प्राध्यापक भर्ती 2026 — 500 पद");
  await expect(page.getByLabel("विभाग / संस्था *")).toHaveValue("RPSC");
  await expect(page.getByLabel("कुल पद")).toHaveValue("500");
  await expect(page.getByLabel("अंतिम तिथि", { exact: true })).toHaveValue(day(30));
  await expect(page.locator(".ProseMirror")).toContainText("RPSC ने 500 पदों पर भर्ती निकाली है।");
});

test("schedule a post for later", async ({ page, backend }) => {
  await page.goto("/admin/posts/new");
  await page.getByRole("button", { name: "लेख", exact: true }).or(page.getByRole("button", { name: "जानकारी", exact: true })).first().click();
  await page.getByLabel("शीर्षक", { exact: true }).fill("कल सुबह प्रकाशित होने वाली पोस्ट");
  await page.getByRole("switch").first().click();
  await page.getByRole("button", { name: "शेड्यूल करें" }).first().click();
  await page.getByLabel("शेड्यूल का समय").fill(`${day(1)}T09:00`);
  await page.getByRole("button", { name: "शेड्यूल करें" }).last().click();
  await expect(page.getByText("पोस्ट शेड्यूल हो गई")).toBeVisible();
  expect(backend.writes("posts", "PATCH").at(-1)!.body).toEqual({ status: "scheduled" });
});

test("posts list: filter, edit link and delete with confirmation", async ({ page, backend }) => {
  await page.goto("/admin/posts");
  await expect(page.getByText("राजस्थान पुलिस कांस्टेबल भर्ती 2026 — 9617 पद")).toBeVisible();
  await page.getByRole("button", { name: "ड्राफ़्ट", exact: true }).click();
  await expect.poll(() => backend.find((c) => c.path === "/rest/v1/posts" && c.query.get("status") === "eq.draft").length).toBeGreaterThan(0);
  await page.getByRole("button", { name: "सभी", exact: true }).click();

  const row = page.getByRole("row").filter({ hasText: "SBI क्लर्क भर्ती 2026" });
  await expect(row.getByRole("link", { name: "संपादित करें" })).toHaveAttribute("href", "/admin/posts/e2e10000-0000-4000-8000-000000000002");
  await row.getByRole("button", { name: "हटाएँ" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("यह पोस्ट हटाएँ?");
  await dialog.getByRole("button", { name: "हटाएँ" }).click();
  await expect(page.getByText("पोस्ट हटा दी गई")).toBeVisible();
  expect(backend.writes("posts", "DELETE")[0].query.get("id")).toBe("eq.e2e10000-0000-4000-8000-000000000002");
});

test("admins can preview drafts", async ({ page }) => {
  await page.goto("/blog/e2e10000-0000-4000-8000-000000000009");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ड्राफ्ट — पाठकों को नहीं दिखना चाहिए");
});

test("quiz editor saves a new question for today", async ({ page, backend }) => {
  await page.goto("/admin/quiz");
  await expect(page.getByPlaceholder("सवाल लिखें").first()).toHaveValue("राजस्थान की राजधानी कौनसी है?");
  await page.getByRole("button", { name: /सवाल जोड़ें/ }).click();
  const q3 = page.getByPlaceholder("सवाल लिखें").nth(2);
  await q3.fill("थार मरुस्थल किस राज्य में सबसे ज़्यादा फैला है?");
  const opts = ["राजस्थान", "गुजरात", "पंजाब", "हरियाणा"];
  for (const [i, o] of opts.entries()) await page.getByPlaceholder(`विकल्प ${i + 1}`).nth(2).fill(o);
  await page.getByRole("radio", { name: "विकल्प 1 सही है" }).nth(2).check();
  await page.getByRole("button", { name: "क्विज़ सेव करें" }).click();
  await expect(page.getByText(/की क्विज़ सेव हो गई/)).toBeVisible();
  const inserted = backend.writes("quiz_questions", "POST")[0].body;
  expect(inserted).toHaveLength(3);
  expect(inserted[2]).toMatchObject({ quiz_date: istToday(), position: 3, correct_index: 0, options: opts });
});

test("moderation queue loads", async ({ page }) => {
  await page.goto("/admin/moderation");
  await expect(page.getByRole("heading", { name: "सवाल और मॉडरेशन" })).toBeVisible();
  await expect(page.getByText("अभी कोई सवाल नहीं।")).toBeVisible();
});
