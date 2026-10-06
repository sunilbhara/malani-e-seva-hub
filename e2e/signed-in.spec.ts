import { expect, test } from "./support/test";
import { RECRUITMENTS, TEST_USERS } from "./support/data";

const reader = TEST_USERS.reader;
const POLICE = "/blog/rajasthan-police-constable-2026";
const POLICE_ID = "e2e10000-0000-4000-8000-000000000001";

test.beforeEach(async ({ signInAs, skipPreferenceSheet }) => {
  await skipPreferenceSheet();
  await signInAs("reader");
});

test("like, follow, applied and reminder are saved to the account", async ({ page, backend }) => {
  await page.goto(POLICE);
  const like = page.getByRole("button", { name: /उपयोगी/ });
  await expect(like).toContainText("(3)");
  await like.click();
  await expect(like).toContainText("(4)");
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => backend.writes("post_likes", "POST").length).toBe(1);
  expect(backend.writes("post_likes", "POST")[0].body).toMatchObject({ post_id: POLICE_ID, user_id: reader.id });

  await page.getByRole("button", { name: /भर्ती फॉलो करें/ }).click();
  await expect(page.getByText("फॉलो किया — इस भर्ती की हर अपडेट आपको मिलेगी")).toBeVisible();
  await page.getByRole("button", { name: /मैंने आवेदन किया/ }).click();
  await expect(page.getByText("बढ़िया! मेरी नौकरियाँ में ट्रैकर बन गया")).toBeVisible();
  expect(backend.writes("recruitment_follows", "POST").map((c) => c.body)).toEqual([
    { recruitment_id: RECRUITMENTS[0].id, user_id: reader.id },
    expect.objectContaining({ recruitment_id: RECRUITMENTS[0].id, user_id: reader.id, applied: true }),
  ]);

  await page.getByRole("button", { name: "मुझे याद दिलाएँ" }).click();
  await expect(page.getByRole("button", { name: "रिमाइंडर लगा है" })).toBeVisible();
  expect(backend.writes("job_reminders", "POST")[0].body).toMatchObject({ post_id: POLICE_ID, user_id: reader.id });
});

test("My Jobs tracker shows the recruitment's progress and next step", async ({ page, backend }) => {
  backend.tables.recruitment_follows.push({ recruitment_id: RECRUITMENTS[0].id, user_id: reader.id, applied: true, applied_at: new Date().toISOString(), created_at: new Date().toISOString() });
  backend.tables.job_reminders.push({ post_id: POLICE_ID, user_id: reader.id });
  await page.goto("/my");
  await page.getByRole("tab", { name: "आवेदन / फॉलो" }).click();
  await expect(page.getByText("राजस्थान पुलिस कांस्टेबल 2026", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "एडमिट कार्ड डाउनलोड करें" })).toHaveAttribute("href", "/blog/police-admit-card");
  await page.getByRole("tab", { name: /रिमाइंडर/ }).click();
  await expect(page.getByRole("link", { name: "राजस्थान पुलिस कांस्टेबल भर्ती 2026 — 9617 पद" })).toBeVisible();
});

test("ask a question and see it posted", async ({ page, backend }) => {
  await page.goto(`${POLICE}#qa`);
  const box = page.getByLabel("आपका सवाल");
  await box.fill("क्या 12वीं के छात्र आवेदन कर सकते हैं?");
  await page.getByRole("button", { name: "सवाल पूछें" }).click();
  await expect(page.getByText("सवाल पोस्ट हो गया। जवाब आने पर आपको सूचना मिलेगी।")).toBeVisible();
  await expect(box).toHaveValue("");
  await expect(page.getByText("क्या 12वीं के छात्र आवेदन कर सकते हैं?")).toBeVisible();
  expect(backend.writes("comments", "POST")[0].body).toMatchObject({ post_id: POLICE_ID, user_id: reader.id, parent_id: null });
});

test("notification bell lists notifications and marks them read", async ({ page, backend }) => {
  backend.tables.user_notifications.push({ id: "n1", user_id: reader.id, post_id: POLICE_ID, title: "नई भर्ती: राजस्थान पुलिस", body: "9617 पद", created_at: new Date().toISOString(), read_at: null });
  await page.goto("/");
  const bell = page.getByRole("button", { name: "सूचनाएँ, 1 नई" });
  await expect(bell).toBeVisible();
  await bell.click();
  await expect(page.getByText("नई भर्ती: राजस्थान पुलिस")).toBeVisible();
  await page.getByRole("button", { name: /सब पढ़ा/ }).click();
  await expect.poll(() => backend.rpcCalls("mark_notifications_read").length).toBeGreaterThan(0);
});

test("profile: rename, preferences and theme", async ({ page, backend }) => {
  await page.goto("/profile");
  const name = page.getByLabel("दिखने वाला नाम (सवाल-जवाब में)");
  await expect(name).toHaveValue(reader.name);
  await name.fill("राम सिंह");
  await page.getByRole("button", { name: "सेव करें" }).click();
  await expect(page.getByText("नाम सेव हो गया")).toBeVisible();
  expect(backend.writes("profiles", "PATCH")[0].body).toEqual({ full_name: "राम सिंह" });

  await page.getByRole("main").getByRole("radio", { name: "डार्क" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("account deletion requires typing हटाएँ", async ({ page, backend }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: /खाता हमेशा के लिए हटाएँ/ }).click();
  const dialog = page.getByRole("alertdialog");
  const confirm = dialog.getByRole("button", { name: "हमेशा के लिए हटाएँ" });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel("पुष्टि के लिए हटाएँ लिखें").fill("हटाएँ");
  await confirm.click();
  await expect(page).toHaveURL(/\/$/);
  expect(backend.find((c) => c.path === "/functions/v1/delete-account")[0].body).toEqual({ confirm: "DELETE" });
});

test("readers cannot open admin pages", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByText("इस पेज के लिए एडमिन अनुमति चाहिए।")).toBeVisible();
});
