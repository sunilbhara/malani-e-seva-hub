// Shared Playwright fixtures: a fresh mock backend per test, helpers to sign in, and a
// guard that fails the test on uncaught page errors, console errors or unexpected
// requests to third-party hosts.
import { expect, test as base, type Page } from "@playwright/test";
import { MockBackend, STORAGE_KEY, sessionFor } from "./backend";
import { TEST_USERS } from "./data";

type Role = keyof typeof TEST_USERS;

interface Fixtures {
  backend: MockBackend;
  /** Puts a valid session in localStorage before the app loads. */
  signInAs: (role: Role) => Promise<void>;
  /** Skips the first-visit preference sheet (set before navigation). */
  skipPreferenceSheet: () => Promise<void>;
  errors: string[];
}

const IGNORED_CONSOLE = [/Failed to load resource/i, /net::ERR_BLOCKED_BY_CLIENT/i, /Download the React DevTools/i];

export const test = base.extend<Fixtures>({
  // auto: installed for every test, so no request can ever reach a real host.
  backend: [
    async ({ context }, use) => {
      const backend = new MockBackend();
      await backend.install(context);
      await use(backend);
    },
    { auto: true },
  ],
  errors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error" && !IGNORED_CONSOLE.some((re) => re.test(m.text()))) errors.push(`console: ${m.text()}`);
    });
    await use(errors);
  }, { auto: true }],
  signInAs: async ({ context }, use) => {
    await use(async (role) => {
      const session = sessionFor(TEST_USERS[role]);
      await context.addInitScript(
        ([key, value]) => {
          if (window.top !== window) return;
          try {
            window.localStorage.setItem(key, value);
          } catch {
            /* sandboxed frame */
          }
        },
        [STORAGE_KEY, JSON.stringify(session)] as const,
      );
    });
  },
  skipPreferenceSheet: async ({ context }, use) => {
    await use(async () => {
      await context.addInitScript(() => {
        if (window.top !== window) return;
        try {
          if (!window.localStorage.getItem("malani-preferences")) {
            window.localStorage.setItem("malani-preferences", JSON.stringify({ qualification: null, departments: [], district: null, completedAt: null, dismissedAt: new Date().toISOString() }));
          }
        } catch {
          /* sandboxed frame */
        }
      });
    });
  },
});

test.afterEach(async ({ backend, errors }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) return;
  expect(errors, "page errors / console errors").toEqual([]);
  expect(backend.external.filter((u) => !/google\.com\/maps|maps\.google/.test(u)), "unexpected third-party requests").toEqual([]);
});

export { expect };

export async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page must not scroll sideways").toBeLessThanOrEqual(1);
}
