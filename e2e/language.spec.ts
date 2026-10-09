import { expect, test } from "./support/test";

test.beforeEach(async ({ skipPreferenceSheet }) => skipPreferenceSheet());

test("English switch translates the interface, keeps post content, remembers the choice and switches back", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("आपकी अगली सरकारी नौकरी यहाँ है");

  await page.getByRole("button", { name: "View in English" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your next government job is here");
  await expect(page.locator("html")).toHaveAttribute("lang", "en-IN");
  await expect(page.getByRole("searchbox").first()).toHaveAttribute("placeholder", "Search recruitment, department or post…");
  await expect(page).toHaveTitle("Government jobs, admit cards, results — Barmer | Malani");

  // Navigating keeps English; post content written by the admin stays as written.
  await page.goto("/blog/rajasthan-police-constable-2026");
  await expect(page.getByRole("link", { name: "Apply" }).first()).toBeVisible();
  await expect(page.locator(".post-body")).toContainText("योग्यता");

  // Choice survives a reload, and switching back restores Hindi without a reload.
  await page.reload();
  await expect(page.getByRole("link", { name: "Apply" }).first()).toBeVisible();
  await page.getByRole("button", { name: "हिंदी में देखें" }).click();
  await expect(page.getByRole("link", { name: "आवेदन करें" }).first()).toBeVisible();
});
