// Sign-in, sign-up, password reset and sign-out against the mock auth server.
// Credentials are the test users in e2e/support/data.ts; nothing leaves the browser.
import { expect, test } from "./support/test";
import { TEST_USERS } from "./support/data";
import { STORAGE_KEY } from "./support/backend";

const reader = TEST_USERS.reader;

test.beforeEach(async ({ skipPreferenceSheet }) => skipPreferenceSheet());

test("wrong password shows a Hindi error and keeps the reader on the page", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("ईमेल").fill(reader.email);
  await page.getByLabel("पासवर्ड", { exact: true }).fill("wrong-password-1");
  await page.getByRole("button", { name: "साइन इन", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("ईमेल या पासवर्ड गलत है।");
  await expect(page).toHaveURL(/\/login/);
});

test("sign in returns to the page that asked for it, and the header shows the profile", async ({ page, backend }) => {
  await page.goto("/blog/rajasthan-police-constable-2026");
  await page.getByRole("button", { name: /उपयोगी/ }).click();
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await page.getByLabel("ईमेल").fill(reader.email.toUpperCase());
  await page.getByLabel("पासवर्ड", { exact: true }).fill(reader.password);
  await page.getByRole("button", { name: "साइन इन", exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/rajasthan-police-constable-2026$/);
  // Desktop: header icon; mobile: bottom navigation (post pages hide it, so check from home).
  await page.goto("/");
  await expect(page.getByRole("link", { name: "प्रोफ़ाइल" }).filter({ visible: true }).first()).toBeVisible();
  const tokenCall = backend.find((c) => c.path === "/auth/v1/token")[0];
  expect(tokenCall.body.email).toBe(reader.email);
  const stored = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
  expect(JSON.parse(stored!).user.email).toBe(reader.email);
});

test("guest saves move into the account after sign in", async ({ page, backend }) => {
  await page.goto("/blog/sbi-clerk-2026");
  await page.getByRole("button", { name: /^सेव/ }).first().click();
  await page.goto("/login?redirect=%2Fmy");
  await page.getByLabel("ईमेल").fill(reader.email);
  await page.getByLabel("पासवर्ड", { exact: true }).fill(reader.password);
  await page.getByRole("button", { name: "साइन इन", exact: true }).click();
  await expect(page).toHaveURL(/\/my$/);
  await expect.poll(() => backend.writes("post_bookmarks", "POST").length).toBeGreaterThan(0);
  const upload = backend.writes("post_bookmarks", "POST")[0];
  expect(upload.body).toEqual([{ post_id: "e2e10000-0000-4000-8000-000000000002", user_id: reader.id }]);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("malani-saved-posts"))).toBe("[]");
});

test("sign up checks password strength, then asks to confirm the email", async ({ page, backend }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "नया खाता बनाएँ" }).click();
  await page.getByLabel("आपका नाम").fill("नया पाठक");
  await page.getByLabel("ईमेल").fill("new-reader@example.test");
  await page.getByLabel("पासवर्ड", { exact: true }).fill("onlyletters");
  await page.getByRole("button", { name: "खाता बनाएँ" }).click();
  await expect(page.getByRole("alert")).toContainText("अक्षर और अंक");
  expect(backend.find((c) => c.path === "/auth/v1/signup")).toHaveLength(0);

  await page.getByLabel("पासवर्ड", { exact: true }).fill("Barmer-2026x");
  await page.getByRole("button", { name: "खाता बनाएँ" }).click();
  await expect(page.getByRole("heading", { name: "अपना ईमेल देखें" })).toBeVisible();
  const signup = backend.find((c) => c.path === "/auth/v1/signup")[0];
  expect(signup.body).toMatchObject({ email: "new-reader@example.test", data: { full_name: "नया पाठक" } });
});

test("sign up with an existing email says so", async ({ page }) => {
  await page.goto("/login?action=signup");
  await page.getByLabel("ईमेल").fill(reader.email);
  await page.getByLabel("पासवर्ड", { exact: true }).fill("Barmer-2026x");
  await page.getByRole("button", { name: "खाता बनाएँ" }).click();
  await expect(page.getByRole("alert")).toContainText("पहले से रजिस्टर");
});

test("forgot password sends a reset link to /auth/reset", async ({ page, backend }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "पासवर्ड भूल गए?" }).click();
  await page.getByLabel("ईमेल").fill(reader.email);
  await page.getByRole("button", { name: "लिंक भेजें" }).click();
  await expect(page.getByText(/नया पासवर्ड बनाने का लिंक/)).toBeVisible();
  await expect.poll(() => backend.find((c) => c.path === "/auth/v1/recover").length).toBeGreaterThan(0);
  const recover = backend.find((c) => c.path === "/auth/v1/recover")[0];
  expect(recover.query.get("redirect_to")).toMatch(/\/auth\/reset$/);
});

test("Google sign-in goes to the provider with a same-origin redirect", async ({ page }) => {
  await page.goto("/login?redirect=%2Fquiz");
  await page.getByRole("button", { name: /Google से जारी रखें/ }).click();
  await page.waitForURL(/e2e-mock\.supabase\.co\/auth\/v1\/authorize/);
  const url = new URL(page.url());
  expect(url.searchParams.get("provider")).toBe("google");
  expect(url.searchParams.get("redirect_to")).toMatch(/^http:\/\/localhost:\d+\/quiz$/);
});

test("profile and admin pages send guests to login", async ({ page }) => {
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile$/);
  await page.goto("/admin/posts/new");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Fposts%2Fnew$/);
});

test("sign out clears the session", async ({ page, signInAs }) => {
  await signInAs("reader");
  await page.goto("/profile");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => localStorage.removeItem("__noop"));
  await page.getByRole("button", { name: /साइन आउट/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: /^(साइन इन|लॉगिन)$/ }).filter({ visible: true }).first()).toBeVisible();
});
