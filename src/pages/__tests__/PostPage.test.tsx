import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "@/test/render";
import { signIn } from "@/test/authMock";
import { toast } from "@/test/sonnerMock";
import { daysFromToday, listItem, postDetail } from "@/test/fixtures";
import { loadSavedIds } from "@/lib/savedPosts";

vi.mock("@/hooks/useAuth", () => import("@/test/authMock"));
vi.mock("sonner", () => import("@/test/sonnerMock"));
vi.mock("@/services/posts", () => ({
  getPost: vi.fn(),
  getRelatedPosts: vi.fn(async () => []),
  recordView: vi.fn(async () => undefined),
  recordShare: vi.fn(async () => undefined),
}));
vi.mock("@/services/engagement", () => ({
  hasLiked: vi.fn(async () => false),
  setLiked: vi.fn(async () => undefined),
  listBookmarkIds: vi.fn(async () => []),
  setBookmarked: vi.fn(async () => undefined),
}));
vi.mock("@/services/tracker", async (orig) => ({
  ...(await orig<typeof import("@/services/tracker")>()),
  listFollows: vi.fn(async () => []),
  listReminderPostIds: vi.fn(async () => []),
  setFollow: vi.fn(async () => undefined),
  setApplied: vi.fn(async () => undefined),
  setReminder: vi.fn(async () => undefined),
}));
vi.mock("@/services/comments", async (orig) => ({ ...(await orig<typeof import("@/services/comments")>()), getThreads: vi.fn(async () => []) }));

const posts = await import("@/services/posts");
const engagement = await import("@/services/engagement");
const tracker = await import("@/services/tracker");
const { default: PostPage } = await import("@/pages/PostPage");

const open = (route = "/blog/rajasthan-police-2026") => renderRoute(<PostPage />, { route, path: "/blog/:identifier" });

beforeEach(() => {
  vi.mocked(posts.getPost).mockResolvedValue(postDetail());
});

describe("Post page — reading", () => {
  it("shows title, quick facts, dates, fees and the apply link", async () => {
    open();
    expect(await screen.findByRole("heading", { level: 1, name: "राजस्थान पुलिस कांस्टेबल भर्ती 2026" })).toBeInTheDocument();
    expect(screen.getByText("9,617")).toBeInTheDocument();
    expect(screen.getAllByText("12वीं पास").length).toBeGreaterThan(0);
    expect(screen.getByText("18–25 वर्ष")).toBeInTheDocument();
    expect(screen.getByText("3 दिन बचे")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "महत्वपूर्ण तिथियाँ" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "₹600" })).toBeInTheDocument();
    const apply = screen.getByRole("link", { name: /आवेदन करें/ });
    expect(apply).toHaveAttribute("href", "https://police.rajasthan.gov.in/apply");
    expect(apply).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByText(/आधिकारिक स्रोत से सत्यापित/)).toBeInTheDocument();
    expect(screen.getByText(/स्रोत: police.rajasthan.gov.in/)).toBeInTheDocument();
  });

  it("builds a table of contents that links to section anchors", async () => {
    open();
    const toc = await screen.findByRole("navigation", { name: "विषय-सूची" });
    expect(within(toc).getByRole("link", { name: "भर्ती विवरण" })).toHaveAttribute("href", "#section-1");
    expect(document.getElementById("section-2")).toHaveTextContent("योग्यता");
  });

  it("never renders scripts or unsafe links from post HTML", async () => {
    vi.mocked(posts.getPost).mockResolvedValue(postDetail({ content: '<p>ok</p><script>window.hacked=1</script><a href="javascript:alert(1)">x</a><img src=x onerror="window.hacked=1">' }));
    open();
    await screen.findByText("ok");
    expect(document.querySelector("article script")).toBeNull();
    expect(document.querySelector('a[href^="javascript"]')).toBeNull();
    expect(document.querySelector("img[onerror]")).toBeNull();
  });

  it("font-size control changes the reading scale", async () => {
    open();
    await userEvent.click(await screen.findByRole("button", { name: "अक्षर आकार 4" }));
    expect(screen.getByRole("button", { name: "अक्षर आकार 4" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.style.getPropertyValue("--post-font-scale")).toBe("1.3");
  });

  it("records one view for a published post", async () => {
    open();
    await screen.findByRole("heading", { level: 1 });
    await waitFor(() => expect(posts.recordView).toHaveBeenCalledTimes(1));
  });

  it("does not count views for unpublished previews", async () => {
    vi.mocked(posts.getPost).mockResolvedValue(postDetail({ status: "draft" }));
    open("/blog/aaaaaaaa-0000-4000-8000-000000000001");
    await screen.findByRole("heading", { level: 1 });
    expect(posts.recordView).not.toHaveBeenCalled();
  });

  it("old UUID links redirect to the slug URL", async () => {
    const { location } = open("/blog/aaaaaaaa-0000-4000-8000-000000000001");
    await waitFor(() => expect(location()).toBe("/blog/rajasthan-police-2026"));
  });

  it("closed recruitments say so and hide the countdown urgency", async () => {
    vi.mocked(posts.getPost).mockResolvedValue(postDetail({}, { last_date: daysFromToday(-2) }));
    open();
    expect((await screen.findAllByText("आवेदन बंद")).length).toBeGreaterThan(0);
  });

  it("articles without job details render without the facts block", async () => {
    vi.mocked(posts.getPost).mockResolvedValue(postDetail({ post_type: "article", title: "ई-मित्र गाइड" }, null));
    open();
    expect(await screen.findByRole("heading", { level: 1, name: "ई-मित्र गाइड" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /आवेदन करें/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "मुझे याद दिलाएँ" })).not.toBeInTheDocument();
  });

  it("missing posts show a not-found page with a way back", async () => {
    vi.mocked(posts.getPost).mockResolvedValue(null);
    open("/blog/does-not-exist");
    expect(await screen.findByRole("heading", { level: 1, name: "पोस्ट नहीं मिली" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "नौकरियाँ देखें" })).toHaveAttribute("href", "/jobs");
  });

  it("load errors ask the reader to check the connection", async () => {
    vi.mocked(posts.getPost).mockRejectedValue(new Error("offline"));
    open();
    expect(await screen.findByRole("heading", { level: 1, name: "पोस्ट लोड नहीं हो सकी" })).toBeInTheDocument();
  });

  it("shows related posts", async () => {
    vi.mocked(posts.getRelatedPosts).mockResolvedValue([listItem({ title: "पुलिस एडमिट कार्ड" })]);
    open();
    expect(await screen.findByRole("link", { name: "पुलिस एडमिट कार्ड" })).toBeInTheDocument();
  });
});

describe("Post page — guest actions", () => {
  it("save works without login (stored on the phone)", async () => {
    open();
    await screen.findByRole("heading", { level: 1 });
    await userEvent.click(screen.getAllByRole("button", { name: /^सेव/ })[0]);
    await waitFor(() => expect(loadSavedIds()).toEqual(["aaaaaaaa-0000-4000-8000-000000000001"]));
    expect(toast.success).toHaveBeenCalledWith("सेव हो गया — मेरी नौकरियाँ में देखें");
  });

  it("like asks guests to sign in and returns them to the post", async () => {
    const { location } = open();
    await userEvent.click(await screen.findByRole("button", { name: /उपयोगी/ }));
    await waitFor(() => expect(location()).toBe("/login?redirect=%2Fblog%2Frajasthan-police-2026"));
    expect(engagement.setLiked).not.toHaveBeenCalled();
  });

  it("follow/applied ask guests to sign in", async () => {
    const { location } = open();
    await userEvent.click(await screen.findByRole("button", { name: /भर्ती फॉलो करें/ }));
    await waitFor(() => expect(location()).toContain("/login?redirect="));
    expect(tracker.setFollow).not.toHaveBeenCalled();
  });

  it("reminder falls back to a calendar file when push is unavailable", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    open();
    await userEvent.click(await screen.findByRole("button", { name: "मुझे याद दिलाएँ" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("कैलेंडर रिमाइंडर डाउनलोड हुआ — इसे खोलकर सेव करें"));
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it("Q&A asks guests to sign in, returning to the #qa section", async () => {
    open();
    const qa = await screen.findByRole("region", { name: /सवाल-जवाब/ });
    expect(within(qa).getByRole("link", { name: "साइन इन करें" })).toHaveAttribute("href", "/login?redirect=%2Fblog%2Frajasthan-police-2026%23qa");
  });

  it("share sheet offers WhatsApp, Telegram, status image and copy link", async () => {
    open();
    await userEvent.click(await screen.findByRole("button", { name: "शेयर करें" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("link", { name: /WhatsApp पर भेजें/ }).getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(within(dialog).getByRole("link", { name: /Telegram/ }).getAttribute("href")).toMatch(/^https:\/\/t\.me\/share\/url\?url=/);
    expect(within(dialog).getByRole("button", { name: /स्टेटस फोटो/ })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /लिंक कॉपी/ })).toBeInTheDocument();
  });
});

describe("Post page — signed-in actions", () => {
  beforeEach(() => signIn("user", "reader-1"));

  it("like updates optimistically and calls the server", async () => {
    open();
    const like = await screen.findByRole("button", { name: /उपयोगी/ });
    await userEvent.click(like);
    await waitFor(() => expect(engagement.setLiked).toHaveBeenCalledWith("aaaaaaaa-0000-4000-8000-000000000001", "reader-1", true));
    expect(screen.getByRole("button", { name: /उपयोगी/ })).toHaveTextContent("(4)");
  });

  it("like is rolled back with an error toast when the server fails", async () => {
    vi.mocked(engagement.setLiked).mockRejectedValueOnce(new Error("x"));
    open();
    await userEvent.click(await screen.findByRole("button", { name: /उपयोगी/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("अपडेट नहीं हो सका"));
    await waitFor(() => expect(screen.getByRole("button", { name: /उपयोगी/ })).toHaveAttribute("aria-pressed", "false"));
  });

  it("follow and 'I applied' create the tracker", async () => {
    open();
    await userEvent.click(await screen.findByRole("button", { name: /भर्ती फॉलो करें/ }));
    await waitFor(() => expect(tracker.setFollow).toHaveBeenCalledWith("rec-1", "reader-1", true));
    await userEvent.click(screen.getByRole("button", { name: /मैंने आवेदन किया/ }));
    await waitFor(() => expect(tracker.setApplied).toHaveBeenCalledWith("rec-1", "reader-1", true));
  });

  it("account reminder is saved and can be removed", async () => {
    open();
    await userEvent.click(await screen.findByRole("button", { name: "मुझे याद दिलाएँ" }));
    await waitFor(() => expect(tracker.setReminder).toHaveBeenCalledWith("aaaaaaaa-0000-4000-8000-000000000001", "reader-1", true));
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("रिमाइंडर लग गया"));

    vi.mocked(tracker.listReminderPostIds).mockResolvedValue(["aaaaaaaa-0000-4000-8000-000000000001"]);
  });

  it("shows 'reminder set' when one exists", async () => {
    vi.mocked(tracker.listReminderPostIds).mockResolvedValue(["aaaaaaaa-0000-4000-8000-000000000001"]);
    open();
    expect(await screen.findByRole("button", { name: "रिमाइंडर लगा है" })).toBeInTheDocument();
  });

  it("Q&A shows the question box", async () => {
    open();
    expect(await screen.findByLabelText("आपका सवाल")).toBeInTheDocument();
  });
});
