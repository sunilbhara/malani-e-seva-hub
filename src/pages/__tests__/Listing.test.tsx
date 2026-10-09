import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "@/test/render";
import { listItem } from "@/test/fixtures";

vi.mock("@/hooks/useAuth", () => import("@/test/authMock"));
vi.mock("sonner", () => import("@/test/sonnerMock"));
vi.mock("@/services/posts", () => ({ listPosts: vi.fn(), recordShare: vi.fn(async () => undefined) }));
vi.mock("@/services/engagement", () => ({ listBookmarkIds: vi.fn(async () => []), setBookmarked: vi.fn() }));

const { listPosts } = await import("@/services/posts");
const { config } = await import("@/lib/config");
const { default: Listing } = await import("@/pages/Listing");

const lastParams = () => vi.mocked(listPosts).mock.calls.at(-1)?.[0];

describe("Listing (/jobs)", () => {
  it("shows jobs with the total and requests only job posts", async () => {
    vi.mocked(listPosts).mockResolvedValue({ items: [listItem({ title: "SBI क्लर्क" }), listItem({ title: "पटवारी" })], total: 2 });
    renderRoute(<Listing kind="jobs" />, { route: "/jobs" });
    expect(await screen.findByRole("link", { name: "SBI क्लर्क" })).toBeInTheDocument();
    expect(screen.getByText("2 भर्तियाँ")).toBeInTheDocument();
    expect(lastParams()).toMatchObject({ postTypes: ["job"], sort: "latest", limit: 20, offset: 0 });
  });

  it("reads filters from the URL (shareable links)", async () => {
    vi.mocked(listPosts).mockResolvedValue({ items: [], total: 0 });
    renderRoute(<Listing kind="jobs" />, { route: "/jobs?qualification=graduate&department=police&status=closing&sort=deadline&q=SI" });
    await waitFor(() => expect(lastParams()).toMatchObject({ qualification: "graduate", department: "police", jobStatus: "closing", sort: "deadline", search: "SI" }));
    expect(screen.getByRole("button", { name: "ग्रेजुएट हटाएँ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /फ़िल्टर, 4 चुने गए/ })).toBeInTheDocument();
  });

  it("search updates the URL and query", async () => {
    vi.mocked(listPosts).mockResolvedValue({ items: [], total: 0 });
    const { location } = renderRoute(<Listing kind="jobs" />, { route: "/jobs" });
    await userEvent.type(screen.getByRole("searchbox", { name: "खोजें" }), "पुलिस{Enter}");
    await waitFor(() => expect(location()).toBe(`/jobs?q=${encodeURIComponent("पुलिस")}`));
    await waitFor(() => expect(lastParams()?.search).toBe("पुलिस"));
  });

  it("quick chips toggle status and clear", async () => {
    vi.mocked(listPosts).mockResolvedValue({ items: [], total: 0 });
    const { location } = renderRoute(<Listing kind="jobs" />, { route: "/jobs" });
    const closing = screen.getByRole("button", { name: "अंतिम तिथि नज़दीक" });
    await userEvent.click(closing);
    await waitFor(() => expect(location()).toBe("/jobs?status=closing"));
    expect(closing).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(closing);
    await waitFor(() => expect(location()).toBe("/jobs"));
    await userEvent.click(screen.getByRole("button", { name: "राजस्थान" }));
    await waitFor(() => expect(location()).toBe("/jobs?state=rajasthan"));
    await userEvent.click(screen.getByRole("button", { name: "सभी" }));
    await waitFor(() => expect(location()).toBe("/jobs"));
  });

  it("filter chip removal drops just that filter", async () => {
    vi.mocked(listPosts).mockResolvedValue({ items: [], total: 0 });
    const { location } = renderRoute(<Listing kind="jobs" />, { route: "/jobs?qualification=12th&state=rajasthan" });
    await userEvent.click(await screen.findByRole("button", { name: "12वीं पास हटाएँ" }));
    await waitFor(() => expect(location()).toBe("/jobs?state=rajasthan"));
  });

  it("empty results offer to clear filters", async () => {
    vi.mocked(listPosts).mockResolvedValue({ items: [], total: 0 });
    const { location } = renderRoute(<Listing kind="jobs" />, { route: "/jobs?q=zzz" });
    expect(await screen.findByText("कोई नतीजा नहीं मिला")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "फ़िल्टर हटाएँ" }));
    await waitFor(() => expect(location()).toBe("/jobs"));
  });

  it("network errors show a retry that refetches", async () => {
    vi.mocked(listPosts).mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ items: [listItem({ title: "वापस आया" })], total: 1 });
    renderRoute(<Listing kind="jobs" />, { route: "/jobs" });
    await userEvent.click(await screen.findByRole("button", { name: "दोबारा कोशिश करें" }));
    expect(await screen.findByRole("link", { name: "वापस आया" })).toBeInTheDocument();
  });

  it("loads more pages until the total is reached", async () => {
    const first = Array.from({ length: 20 }, () => listItem());
    vi.mocked(listPosts)
      .mockResolvedValueOnce({ items: first, total: 21 })
      .mockResolvedValueOnce({ items: [listItem({ title: "आख़िरी" })], total: 21 });
    renderRoute(<Listing kind="jobs" />, { route: "/jobs" });
    await userEvent.click(await screen.findByRole("button", { name: "और देखें" }));
    expect(await screen.findByRole("link", { name: "आख़िरी" })).toBeInTheDocument();
    expect(lastParams()?.offset).toBe(20);
    expect(screen.queryByRole("button", { name: "और देखें" })).not.toBeInTheDocument();
  });

  it("inserts the alerts card after the 6th job when a channel is configured", async () => {
    const original = config.whatsappChannelUrl;
    (config as { whatsappChannelUrl: string | undefined }).whatsappChannelUrl = "https://whatsapp.com/channel/test";
    vi.mocked(listPosts).mockResolvedValue({ items: Array.from({ length: 7 }, () => listItem()), total: 7 });
    renderRoute(<Listing kind="jobs" />, { route: "/jobs" });
    await screen.findAllByRole("article");
    const grid = screen.getAllByRole("article")[0].parentElement!;
    expect(within(grid).getByRole("heading", { name: "नई भर्ती की सूचना सबसे पहले पाएँ" })).toBeInTheDocument();
    (config as { whatsappChannelUrl: string | undefined }).whatsappChannelUrl = original;
  });

  it("hides the alerts card when no channel or push is configured", async () => {
    const original = config.whatsappChannelUrl;
    (config as { whatsappChannelUrl: string | undefined }).whatsappChannelUrl = undefined;
    vi.mocked(listPosts).mockResolvedValue({ items: Array.from({ length: 7 }, () => listItem()), total: 7 });
    renderRoute(<Listing kind="jobs" />, { route: "/jobs" });
    await screen.findAllByRole("article");
    expect(screen.queryByRole("heading", { name: "नई भर्ती की सूचना सबसे पहले पाएँ" })).not.toBeInTheDocument();
    (config as { whatsappChannelUrl: string | undefined }).whatsappChannelUrl = original;
  });

  it("filter sheet shows a live count and applies", async () => {
    vi.mocked(listPosts).mockResolvedValue({ items: [listItem()], total: 7 });
    const { location } = renderRoute(<Listing kind="jobs" />, { route: "/jobs" });
    await userEvent.click(screen.getByRole("button", { name: "फ़िल्टर" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "ग्रेजुएट" }));
    const apply = await within(dialog).findByRole("button", { name: /दिखाएँ/ });
    await userEvent.click(apply);
    await waitFor(() => expect(location()).toBe("/jobs?qualification=graduate"));
  });
});

describe("Listing variants", () => {
  it("/admit-card requests admit cards and marks its type tab as current", async () => {
    vi.mocked(listPosts).mockResolvedValue({ items: [], total: 0 });
    renderRoute(<Listing kind="admit" />, { route: "/admit-card" });
    await waitFor(() => expect(lastParams()?.postTypes).toEqual(["admit_card"]));
    const tabs = screen.getByRole("navigation", { name: "अपडेट का प्रकार" });
    expect(within(tabs).getByRole("link", { name: "एडमिट कार्ड" })).toHaveAttribute("aria-current", "page");
    expect(within(tabs).getByRole("link", { name: "भर्ती" })).toHaveAttribute("href", "/jobs");
    expect(screen.queryByRole("button", { name: "अंतिम तिथि नज़दीक" })).not.toBeInTheDocument();
  });

  it("/result includes exams; /blog has no type filter", async () => {
    vi.mocked(listPosts).mockResolvedValue({ items: [], total: 0 });
    const { unmount } = renderRoute(<Listing kind="result" />, { route: "/result" });
    await waitFor(() => expect(lastParams()?.postTypes).toEqual(["result", "exam"]));
    unmount();
    renderRoute(<Listing kind="all" />, { route: "/blog" });
    await waitFor(() => expect(lastParams()?.postTypes).toBeUndefined());
  });
});
