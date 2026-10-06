// Renders the real app (real router, auth provider, lazy pages) on every route with an empty
// or failing backend, and checks that no page crashes into the error boundary.
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { sb } from "@/test/supabaseMock";
import { I18nProvider } from "@/i18n";
import routes from "../../config/public-routes.json";

vi.mock("@/lib/supabase", async () => ({ supabase: (await import("@/test/supabaseMock")).sb.supabase }));
vi.mock("@/integrations/supabase/client", async () => ({ supabase: (await import("@/test/supabaseMock")).sb.supabase }));

const { default: App } = await import("@/App");
const { queryClient } = await import("@/lib/queryClient");

const EXTRA = ["/my", "/login", "/login?action=signup", "/auth/reset", "/profile", "/newsletter?status=confirmed", "/blog/missing-post", "/admin", "/admin/posts/new", "/this/does/not/exist", "/home"];
const ALL = [...routes.routes.map((r) => r.path), ...EXTRA];

async function visit(path: string) {
  queryClient.clear();
  window.history.pushState({}, "", path);
  const utils = render(
    <HelmetProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </HelmetProvider>,
  );
  await waitFor(() => expect(document.querySelector("main h1, main [role=alert]")).not.toBeNull(), { timeout: 4000 });
  return utils;
}

describe("every route renders (empty backend)", () => {
  it.each(ALL)("%s", async (path) => {
    const { unmount } = await visit(path);
    expect(screen.queryByText("कुछ गड़बड़ हो गई")).not.toBeInTheDocument();
    expect(document.querySelector("main h1")?.textContent?.trim()).toBeTruthy();
    unmount();
  });
});

describe("every route survives backend errors", () => {
  it.each(["/", "/jobs", "/admit-card", "/result", "/today", "/quiz", "/blog/x", "/my"])("%s", async (path) => {
    sb.on(() => true, { error: { message: "network down", code: "PGRST000" } });
    const { unmount } = await visit(path);
    expect(screen.queryByText("कुछ गड़बड़ हो गई")).not.toBeInTheDocument();
    unmount();
  });
});

describe("routing details", () => {
  it("/home redirects to /", async () => {
    const { unmount } = await visit("/home");
    expect(window.location.pathname).toBe("/");
    unmount();
  });

  it("protected pages send guests to login with a return path", async () => {
    const { unmount } = await visit("/admin/quiz");
    await waitFor(() => expect(window.location.pathname + window.location.search).toBe("/login?redirect=%2Fadmin%2Fquiz"));
    unmount();
  });

  it("unknown URLs show the 404 page", async () => {
    const { unmount } = await visit("/nope");
    expect(screen.getByRole("heading", { level: 1, name: "यह पेज नहीं मिला" })).toBeInTheDocument();
    unmount();
  });
});
