import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("analytics", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("does nothing without a measurement id (and never in tests)", async () => {
    const ga = { initialize: vi.fn(), send: vi.fn(), event: vi.fn() };
    vi.doMock("react-ga4", () => ({ default: ga }));
    const { initAnalytics, track, trackPageView } = await import("@/lib/analytics");
    expect(initAnalytics()).toBe(false);
    track("save_job");
    trackPageView("/jobs");
    expect(ga.initialize).not.toHaveBeenCalled();
  });

  it("queues events until GA loads, drops undefined params", async () => {
    vi.stubEnv("VITE_GOOGLE_ANALYTICS_ID", "G-TEST");
    vi.stubEnv("MODE", "production");
    const ga = { initialize: vi.fn(), send: vi.fn(), event: vi.fn() };
    vi.doMock("react-ga4", () => ({ default: ga }));
    const { initAnalytics, track, trackPageView } = await import("@/lib/analytics");
    expect(initAnalytics()).toBe(true);
    trackPageView("/jobs", "Jobs");
    track("share_whatsapp", { from: "card", missing: undefined });
    // gtag loads only when the browser is idle after load (Phase 5), so nothing is sent yet.
    expect(ga.initialize).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(ga.initialize).toHaveBeenCalledWith("G-TEST", { gtagOptions: { send_page_view: false } }), { timeout: 4000 });
    expect(ga.send).toHaveBeenCalledWith({ hitType: "pageview", page: "/jobs", title: "Jobs" });
    expect(ga.event).toHaveBeenCalledWith("share_whatsapp", { from: "card" });
    track("save_job");
    expect(ga.event).toHaveBeenLastCalledWith("save_job", {});
  });
});

describe("push support", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is unsupported without a VAPID key, so the UI falls back to calendar reminders", async () => {
    vi.stubEnv("VITE_VAPID_PUBLIC_KEY", "");
    const { pushSupported, pushPermission, currentSubscription, subscribeToPush } = await import("@/lib/push");
    expect(pushSupported()).toBe(false);
    expect(pushPermission()).toBe("unsupported");
    expect(await currentSubscription()).toBeNull();
    await expect(subscribeToPush(["all"])).rejects.toThrow("उपलब्ध नहीं");
  });
});

describe("theme", () => {
  it("defaults to the phone setting and remembers a manual choice", async () => {
    const { ThemeProvider } = await import("@/lib/theme");
    const { ThemeToggle } = await import("@/components/common/ThemeToggle");
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(screen.getByRole("radio", { name: "फ़ोन के अनुसार" })).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.dataset.theme).toBe("light");
    await userEvent.click(screen.getByRole("radio", { name: "डार्क" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("malani-theme")).toBe('"dark"');
    await userEvent.click(screen.getByRole("radio", { name: "लाइट" }));
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});

describe("structured data", () => {
  it("JobPosting has Google-required fields and IST deadline", async () => {
    const { buildJobPostingSchema } = await import("@/lib/seo");
    const s = buildJobPostingSchema({
      title: "राजस्थान पुलिस भर्ती",
      descriptionHtml: "<p>x</p>",
      slug: "police",
      organisation: "Rajasthan Police",
      publishedAt: "2026-10-01T05:00:00Z",
      lastDate: "2026-10-30",
      totalPosts: 9617,
      qualifications: ["12th", "any"],
      state: "rajasthan",
      officialWebsite: "https://police.rajasthan.gov.in",
    });
    expect(s).toMatchObject({
      "@type": "JobPosting",
      validThrough: "2026-10-30T23:59:59+05:30",
      datePosted: "2026-10-01T05:00:00Z",
      totalJobOpenings: 9617,
      educationRequirements: "12वीं पास",
      hiringOrganization: { name: "Rajasthan Police", sameAs: "https://police.rajasthan.gov.in" },
      jobLocation: { address: { addressRegion: "Rajasthan", addressCountry: "IN" } },
      url: "https://malanibarmer.com/blog/police",
    });
  });

  it("NewsArticle and breadcrumbs use absolute URLs", async () => {
    const { buildArticleSchema, buildBreadcrumbSchema, absoluteUrl } = await import("@/lib/seo");
    expect(absoluteUrl("/jobs")).toBe("https://malanibarmer.com/jobs");
    const article = buildArticleSchema({ title: "t".repeat(200), description: "d", slug: "s", publishedAt: "2026-10-01" });
    expect(article.headline).toHaveLength(110);
    expect(article.dateModified).toBe("2026-10-01");
    expect(article.inLanguage).toBe("hi-IN");
    const crumbs = buildBreadcrumbSchema([{ name: "होम", path: "/" }, { name: "नौकरियाँ", path: "/jobs" }]);
    expect(JSON.stringify(crumbs)).toContain("https://malanibarmer.com/jobs");
  });
});

describe("business info", () => {
  it("WhatsApp and phone links use the shop number", async () => {
    const { whatsappHref, telHref, BUSINESS } = await import("@/lib/business");
    expect(telHref).toBe(`tel:+${BUSINESS.phoneDigits}`);
    expect(whatsappHref("नमस्ते")).toBe(`https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent("नमस्ते")}`);
  });

  it("open/closed follows IST shop hours", async () => {
    const { isOpenAt } = await import("@/lib/business");
    expect(isOpenAt(new Date("2026-10-05T06:30:00Z"))).toBe(true); // Mon 12:00 IST
    expect(isOpenAt(new Date("2026-10-05T22:00:00Z"))).toBe(false); // Tue 03:30 IST
  });
});
