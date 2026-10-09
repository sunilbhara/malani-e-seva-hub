import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { renderRoute } from "@/test/render";
import { setAuth, signIn } from "@/test/authMock";
import { toast } from "@/test/sonnerMock";
import { daysFromToday, postDetail } from "@/test/fixtures";
import { istToday } from "@/lib/format";

vi.mock("@/hooks/useAuth", () => import("@/test/authMock"));
vi.mock("sonner", () => import("@/test/sonnerMock"));
// TipTap needs layout APIs jsdom lacks; the editor itself is covered by Playwright.
vi.mock("@/components/admin/RichTextEditor", () => ({
  RichTextEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="विवरण संपादक" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));
vi.mock("@/services/posts", async (orig) => ({
  ...(await orig<typeof import("@/services/posts")>()),
  getPost: vi.fn(),
  savePost: vi.fn(async () => ({ id: "new-post-id", slug: "s" })),
  listAdminPosts: vi.fn(async () => ({ items: [], total: 0 })),
  deletePost: vi.fn(async () => undefined),
  getAdminAnalytics: vi.fn(),
  getAdminTodo: vi.fn(async () => ({ drafts: [], draft_count: 0, short_posts: [], short_count: 0, closing_jobs: [], unanswered: [], quiz_today: true, products_without_price: 0 })),
  findSimilarTitles: vi.fn(async () => []),
}));
vi.mock("@/services/tracker", () => ({ listRecruitments: vi.fn(async () => [{ id: "rec-1", name: "पुलिस 2026", organisation: "पुलिस" }]), createRecruitment: vi.fn() }));
vi.mock("@/services/media", () => ({ uploadBlogImage: vi.fn() }));
vi.mock("@/services/ai", () => ({ generateDraft: vi.fn() }));
vi.mock("@/services/quiz", () => ({ adminGetQuiz: vi.fn(async () => []), adminSaveQuiz: vi.fn(async () => undefined) }));
vi.mock("@/services/comments", async (orig) => ({
  ...(await orig<typeof import("@/services/comments")>()),
  getModerationQueue: vi.fn(async () => []),
  moderateComment: vi.fn(async () => undefined),
  deleteComment: vi.fn(async () => undefined),
}));

const posts = await import("@/services/posts");
const tracker = await import("@/services/tracker");
const media = await import("@/services/media");
const ai = await import("@/services/ai");
const quiz = await import("@/services/quiz");
const { default: AdminLayout } = await import("@/pages/admin/AdminLayout");
const { default: PostEditor } = await import("@/pages/admin/PostEditor");
const { default: AdminPosts } = await import("@/pages/admin/AdminPosts");
const { default: AdminQuiz } = await import("@/pages/admin/AdminQuiz");
const { default: AdminDashboard } = await import("@/pages/admin/AdminDashboard");

const adminTree = (
  <Routes>
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<p>dashboard</p>} />
      <Route path="posts" element={<p>posts list</p>} />
    </Route>
  </Routes>
);

describe("Admin access", () => {
  it("shows a spinner while auth loads", () => {
    setAuth({ loading: true });
    renderRoute(adminTree, { route: "/admin" });
    expect(screen.queryByText("dashboard")).not.toBeInTheDocument();
  });

  it("guests are sent to login with a return path", async () => {
    const { location } = renderRoute(adminTree, { route: "/admin/posts" });
    await waitFor(() => expect(location()).toBe("/login?redirect=%2Fadmin%2Fposts"));
  });

  it("signed-in non-admins see a permission message, not the admin UI", () => {
    signIn("user");
    renderRoute(adminTree, { route: "/admin" });
    expect(screen.getByText("इस पेज के लिए एडमिन अनुमति चाहिए।")).toBeInTheDocument();
    expect(screen.queryByText("dashboard")).not.toBeInTheDocument();
  });

  it("admins get the admin navigation and page", () => {
    signIn("admin");
    renderRoute(adminTree, { route: "/admin" });
    expect(screen.getByText("dashboard")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "एडमिन" });
    expect(within(nav).getAllByRole("link").map((l) => l.getAttribute("href"))).toEqual(["/admin", "/admin/posts", "/admin/posts/new", "/admin/moderation", "/admin/quiz", "/admin/catalog"]);
  });
});

describe("Post editor", () => {
  beforeEach(() => signIn("admin", "admin-1"));
  const openNew = () => renderRoute(<PostEditor />, { route: "/admin/posts/new", path: "/admin/posts/new" });

  it("blocks saving with clear Hindi errors", async () => {
    openNew();
    await userEvent.click(screen.getByRole("button", { name: "प्रकाशित करें" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("शीर्षक लिखें।");
    expect(alert).toHaveTextContent("भर्ती का विभाग/संस्था लिखें।");
    expect(posts.savePost).not.toHaveBeenCalled();
  });

  it("rejects javascript: links", async () => {
    openNew();
    await userEvent.type(screen.getByLabelText("शीर्षक"), "RPSC भर्ती");
    await userEvent.type(screen.getByLabelText("विभाग / संस्था *"), "RPSC");
    await userEvent.type(screen.getByLabelText("ऑनलाइन आवेदन लिंक"), "javascript:alert(1)");
    await userEvent.click(screen.getByRole("button", { name: "प्रकाशित करें" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("आवेदन लिंक: केवल https:// वाला लिंक डालें।");
  });

  it("publishes a structured job post and opens it for editing", async () => {
    const { location } = renderRoute(
      <Routes>
        <Route path="/admin/posts/new" element={<PostEditor key="new" />} />
        <Route path="/admin/posts/:id" element={<p>editing</p>} />
      </Routes>,
      { route: "/admin/posts/new" },
    );
    await userEvent.type(screen.getByLabelText("शीर्षक"), "RSMSSB पटवारी भर्ती 2026");
    await userEvent.type(screen.getByLabelText("विभाग / संस्था *"), "RSMSSB");
    await userEvent.type(screen.getByLabelText("कुल पद"), "2020abc");
    await userEvent.click(screen.getByRole("button", { name: "ग्रेजुएट" }));
    await userEvent.click(screen.getByRole("button", { name: "पटवारी" }));
    await userEvent.type(screen.getByLabelText("अंतिम तिथि"), daysFromToday(20));
    await userEvent.type(screen.getByLabelText("ऑनलाइन आवेदन लिंक"), "https://rsmssb.rajasthan.gov.in");
    await userEvent.click(screen.getByRole("button", { name: /शुल्क जोड़ें/ }));
    await userEvent.type(screen.getByPlaceholderText("सामान्य / OBC"), "सामान्य");
    await userEvent.clear(screen.getByLabelText("राशि ₹"));
    await userEvent.type(screen.getByLabelText("राशि ₹"), "600");
    await userEvent.type(screen.getByLabelText("टैग (कॉमा से अलग)"), "पटवारी, राजस्थान, पटवारी");
    await userEvent.click(screen.getByRole("button", { name: "प्रकाशित करें" }));

    await waitFor(() => expect(posts.savePost).toHaveBeenCalled());
    const arg = vi.mocked(posts.savePost).mock.calls[0][0];
    expect(arg.authorId).toBe("admin-1");
    expect(arg.id).toBeUndefined();
    expect(arg.post).toMatchObject({ title: "RSMSSB पटवारी भर्ती 2026", status: "published", post_type: "job", tags: ["पटवारी", "राजस्थान"] });
    expect(arg.job).toMatchObject({
      organisation: "RSMSSB",
      total_posts: 2020,
      qualifications: ["graduate"],
      departments: ["patwari"],
      last_date: daysFromToday(20),
      apply_link: "https://rsmssb.rajasthan.gov.in/",
      fees: [{ category: "सामान्य", amount: 600 }],
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("पोस्ट प्रकाशित हो गई"));
    // Publishing offers sharing first; closing that dialog continues to the editor.
    const share = await screen.findByRole("dialog", { name: "पोस्ट प्रकाशित हो गई — अब शेयर करें" });
    expect(within(share).getByRole("link", { name: /WhatsApp पर शेयर करें/ })).toHaveAttribute("href", expect.stringContaining("wa.me"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(location()).toBe("/admin/posts/new-post-id"));
  }, 30_000);

  it("scheduling requires a future time", async () => {
    openNew();
    await userEvent.type(screen.getByLabelText("शीर्षक"), "शेड्यूल पोस्ट");
    // First switch = "भर्ती की जानकारी" (job details) toggle; turn it off for a plain article.
    await userEvent.click(screen.getAllByRole("switch")[0]);
    await userEvent.click(screen.getByRole("button", { name: "शेड्यूल करें" }));
    await userEvent.click(screen.getAllByRole("button", { name: "शेड्यूल करें" }).at(-1)!);
    expect(await screen.findByRole("alert")).toHaveTextContent("शेड्यूल का समय चुनें।");
  });

  it("switching to admit card swaps the template and category", async () => {
    openNew();
    await userEvent.click(screen.getByRole("button", { name: "एडमिट कार्ड" }));
    expect(screen.getByLabelText("कैटेगरी")).toHaveValue("Admit Card");
    expect((screen.getByLabelText("विवरण संपादक") as HTMLTextAreaElement).value).toContain("एडमिट कार्ड कैसे डाउनलोड करें");
  });

  it("AI draft fills title, content and job fields", async () => {
    vi.mocked(ai.generateDraft).mockResolvedValue({
      title: "RPSC प्राध्यापक भर्ती 2026",
      metaDescription: "RPSC ने 500 पदों पर भर्ती निकाली",
      content: "<h2>भर्ती</h2><p>विवरण</p>",
      postType: "job",
      tags: ["RPSC"],
      job: {
        organisation: "RPSC", totalPosts: 500, qualifications: ["postgraduate"], departments: ["rpsc"], state: "rajasthan",
        ageMin: 21, ageMax: 40, applyStart: null, lastDate: daysFromToday(30), feeLastDate: null, examDate: null, admitCardDate: null,
        resultDate: null, salary: null, fees: [], applyLink: "https://rpsc.rajasthan.gov.in", notificationPdf: null, officialWebsite: null,
      },
    });
    openNew();
    await userEvent.click(screen.getByRole("button", { name: /AI से ड्राफ़्ट/ }));
    const sheet = await screen.findByRole("dialog");
    const make = within(sheet).getByRole("button", { name: /ड्राफ़्ट बनाएँ/ });
    expect(make).toBeDisabled();
    await userEvent.type(within(sheet).getByPlaceholderText("भर्ती की पूरी जानकारी यहाँ पेस्ट करें…"), "RPSC notification text");
    await userEvent.click(make);
    await waitFor(() => expect(screen.getByLabelText("शीर्षक")).toHaveValue("RPSC प्राध्यापक भर्ती 2026"));
    expect(screen.getByLabelText("विभाग / संस्था *")).toHaveValue("RPSC");
    expect(screen.getByLabelText("कुल पद")).toHaveValue("500");
    expect(screen.getByLabelText("अंतिम तिथि")).toHaveValue(daysFromToday(30));
    expect(screen.getByLabelText("SEO विवरण")).toHaveValue("RPSC ने 500 पदों पर भर्ती निकाली");
  });

  it("AI errors are shown and the form is untouched", async () => {
    vi.mocked(ai.generateDraft).mockRejectedValue(new Error("बहुत ज़्यादा अनुरोध"));
    openNew();
    await userEvent.click(screen.getByRole("button", { name: /AI से ड्राफ़्ट/ }));
    const sheet = await screen.findByRole("dialog");
    await userEvent.type(within(sheet).getByRole("textbox"), "x");
    await userEvent.click(within(sheet).getByRole("button", { name: /ड्राफ़्ट बनाएँ/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("बहुत ज़्यादा अनुरोध"));
    expect(screen.getByLabelText("शीर्षक")).toHaveValue("");
  });

  it("cover upload shows validation errors from the uploader", async () => {
    vi.mocked(media.uploadBlogImage).mockRejectedValue(new Error("फोटो 5 MB से छोटी होनी चाहिए।"));
    const { container } = openNew();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File(["x"], "a.png", { type: "image/png" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("फोटो 5 MB से छोटी होनी चाहिए।"));
  });

  it("editing loads the existing post and saves with its id", async () => {
    vi.mocked(posts.getPost).mockResolvedValue(postDetail());
    renderRoute(<PostEditor />, { route: "/admin/posts/aaaaaaaa-0000-4000-8000-000000000001", path: "/admin/posts/:id" });
    expect(await screen.findByDisplayValue("राजस्थान पुलिस कांस्टेबल भर्ती 2026")).toBeInTheDocument();
    expect(screen.getByLabelText("विभाग / संस्था *")).toHaveValue("राजस्थान पुलिस");
    expect(screen.getByRole("heading", { name: "पोस्ट संपादित करें" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "प्रकाशित करें" }));
    await waitFor(() => expect(vi.mocked(posts.savePost).mock.calls[0][0].id).toBe("aaaaaaaa-0000-4000-8000-000000000001"));
  });

  it("save failures from the database are explained", async () => {
    vi.mocked(posts.savePost).mockRejectedValue({ message: "new row violates check constraint" });
    openNew();
    await userEvent.type(screen.getByLabelText("शीर्षक"), "x");
    await userEvent.type(screen.getByLabelText("विभाग / संस्था *"), "RPSC");
    await userEvent.click(screen.getByRole("button", { name: "प्रकाशित करें" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("कोई फ़ील्ड सही फ़ॉर्मेट में नहीं है (लिंक/तारीख जाँचें)।"));
  });

  it("a recruitment series can be created inline", async () => {
    vi.mocked(tracker.createRecruitment).mockResolvedValue({ id: "rec-new", name: "RPSC 2026", organisation: "RPSC" });
    openNew();
    await userEvent.type(screen.getByPlaceholderText("नई सीरीज़, जैसे RSMSSB पटवारी 2026"), "RPSC 2026");
    await userEvent.click(screen.getByRole("button", { name: "सीरीज़ जोड़ें" }));
    await waitFor(() => expect(tracker.createRecruitment).toHaveBeenCalledWith("RPSC 2026", "RPSC 2026"));
    expect(toast.success).toHaveBeenCalledWith("भर्ती सीरीज़ बन गई");
  });
});

describe("Admin posts list", () => {
  beforeEach(() => signIn("admin"));

  it("filters by status, searches and deletes after confirmation", async () => {
    vi.mocked(posts.listAdminPosts).mockResolvedValue({
      items: [{ id: "p1", title: "पुरानी पोस्ट", slug: "old", status: "published", post_type: "job", category: "Government Job", published_at: null, scheduled_at: null, updated_at: "2026-10-01T00:00:00Z", views_count: 5, likes_count: 0, comments_count: 1, share_count: 0 }],
      total: 1,
    });
    renderRoute(<AdminPosts />);
    expect(await screen.findByText("पुरानी पोस्ट")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "देखें" })[0]).toHaveAttribute("href", "/blog/old");
    await userEvent.click(screen.getByRole("button", { name: "ड्राफ़्ट" }));
    await waitFor(() => expect(posts.listAdminPosts).toHaveBeenLastCalledWith(expect.objectContaining({ status: "draft", offset: 0 })));
    await userEvent.type(screen.getByPlaceholderText("शीर्षक से खोजें…"), "RAS");
    await waitFor(() => expect(posts.listAdminPosts).toHaveBeenLastCalledWith(expect.objectContaining({ search: "RAS" })));

    await userEvent.click(screen.getAllByRole("button", { name: "हटाएँ" })[0]);
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("यह पोस्ट हटाएँ?");
    await userEvent.click(within(dialog).getByRole("button", { name: "हटाएँ" }));
    await waitFor(() => expect(posts.deletePost).toHaveBeenCalledWith("p1"));
    expect(toast.success).toHaveBeenCalledWith("पोस्ट हटा दी गई");
  });

  it("cancel keeps the post", async () => {
    vi.mocked(posts.listAdminPosts).mockResolvedValue({
      items: [{ id: "p1", title: "रखें", slug: "k", status: "draft", post_type: "job", category: null, published_at: null, scheduled_at: null, updated_at: "2026-10-01T00:00:00Z", views_count: 0, likes_count: 0, comments_count: 0, share_count: 0 }],
      total: 1,
    });
    renderRoute(<AdminPosts />);
    await userEvent.click((await screen.findAllByRole("button", { name: "हटाएँ" }))[0]);
    await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "रद्द करें" }));
    expect(posts.deletePost).not.toHaveBeenCalled();
    expect(screen.getAllByRole("link", { name: "देखें" })[0]).toHaveAttribute("href", "/blog/p1");
  });
});

describe("Admin quiz editor", () => {
  beforeEach(() => signIn("admin"));

  it("validates, then saves numbered questions for the chosen date", async () => {
    vi.mocked(quiz.adminGetQuiz).mockResolvedValue([]);
    renderRoute(<AdminQuiz />);
    await userEvent.click(await screen.findByRole("button", { name: "क्विज़ सेव करें" }));
    expect(toast.error).toHaveBeenCalledWith("सवाल 1: सवाल लिखें।");
    expect(quiz.adminSaveQuiz).not.toHaveBeenCalled();

    await userEvent.type(screen.getByPlaceholderText("सवाल लिखें"), "राजस्थान की राजधानी?");
    for (const [i, opt] of ["जोधपुर", "जयपुर", "बाड़मेर", "अजमेर"].entries()) {
      await userEvent.type(screen.getByPlaceholderText(`विकल्प ${i + 1}`), opt);
    }
    await userEvent.click(screen.getByRole("radio", { name: "विकल्प 2 सही है" }));
    await userEvent.click(screen.getByRole("button", { name: "क्विज़ सेव करें" }));
    await waitFor(() =>
      expect(quiz.adminSaveQuiz).toHaveBeenCalledWith(istToday(), [
        { question: "राजस्थान की राजधानी?", options: ["जोधपुर", "जयपुर", "बाड़मेर", "अजमेर"], correct_index: 1, explanation: null, position: 1 },
      ]),
    );
  });

  it("caps a day at 10 questions and loads existing ones", async () => {
    vi.mocked(quiz.adminGetQuiz).mockResolvedValue([
      { id: "q", quiz_date: istToday(), position: 1, question: "पहला", options: ["a", "b", "c", "d"], correct_index: 3, explanation: "e" },
    ]);
    renderRoute(<AdminQuiz />);
    expect(await screen.findByDisplayValue("पहला")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "विकल्प 4 सही है" })).toBeChecked();
    const add = screen.getByRole("button", { name: /सवाल जोड़ें/ });
    for (let i = 0; i < 9; i += 1) await userEvent.click(add);
    expect(add).toBeDisabled();
    expect(screen.getAllByPlaceholderText("सवाल लिखें")).toHaveLength(10);
  });
});

describe("Admin dashboard", () => {
  beforeEach(() => signIn("admin"));

  it("shows totals from the analytics RPC and handles errors", async () => {
    vi.mocked(posts.getAdminAnalytics).mockResolvedValue({
      totals: { posts: 10, published: 8, drafts: 1, scheduled: 1, views: 1234, likes: 5, comments: 2, shares: 7, bookmarks: 3 },
      subscribers: 4, pending_subscribers: 1, users: 20, push_subscribers: 6, reported_comments: 0,
      categories: [], trending: [], views_last_14_days: Array.from({ length: 14 }, (_, i) => ({ date: `2026-10-${String(i + 1).padStart(2, "0")}`, views: i })),
    });
    const { unmount } = renderRoute(<AdminDashboard />);
    expect(await screen.findByText("1,234")).toBeInTheDocument();
    expect(screen.getByText("कुल व्यूज़")).toBeInTheDocument();
    unmount();
    vi.mocked(posts.getAdminAnalytics).mockRejectedValue(new Error("Admins only"));
    renderRoute(<AdminDashboard />);
    expect(await screen.findByText("आँकड़े लोड नहीं हो सके।")).toBeInTheDocument();
  });

  it("आज के काम lists what needs attention, with links to fix it", async () => {
    vi.mocked(posts.getAdminAnalytics).mockResolvedValue({
      totals: { posts: 1, published: 1, drafts: 0, scheduled: 0, views: 0, likes: 0, comments: 0, shares: 0, bookmarks: 0 },
      subscribers: 0, pending_subscribers: 0, users: 0, push_subscribers: 0, reported_comments: 0, categories: [], trending: [], views_last_14_days: [],
    });
    vi.mocked(posts.getAdminTodo).mockResolvedValue({
      drafts: [{ id: "d1", title: "अधूरी पोस्ट", updated_at: "2026-10-01T00:00:00Z" }],
      draft_count: 1,
      short_posts: [{ id: "s1", title: "छोटी पोस्ट", words: 125 }],
      short_count: 1,
      closing_jobs: [{ id: "j1", title: "पटवारी भर्ती", slug: "patwari", last_date: "2026-10-10", updated_at: "2026-10-01T00:00:00Z" }],
      unanswered: [{ id: "q1", content: "फीस कितनी है?", post_title: "पटवारी भर्ती", post_slug: "patwari", created_at: "2026-10-01T00:00:00Z" }],
      quiz_today: false,
      products_without_price: 2,
    });
    renderRoute(<AdminDashboard />);
    const todo = await screen.findByRole("region", { name: "आज के काम" });
    expect(within(todo).getByText("1 पाठकों के सवाल का जवाब बाकी")).toBeInTheDocument();
    expect(within(todo).getByRole("link", { name: /फीस कितनी है/ })).toHaveAttribute("href", "/blog/patwari#qa");
    expect(within(todo).getByRole("link", { name: "पटवारी भर्ती" })).toHaveAttribute("href", "/admin/posts/j1");
    expect(within(todo).getByText("आज की GK क्विज़ नहीं जोड़ी गई")).toBeInTheDocument();
    expect(within(todo).getByText(/600 शब्द से छोटी/)).toBeInTheDocument();
    expect(within(todo).getByText("2 प्रोडक्ट पर दाम नहीं लिखा")).toBeInTheDocument();
  });

  it("says so when everything is done", async () => {
    vi.mocked(posts.getAdminAnalytics).mockResolvedValue({
      totals: { posts: 1, published: 1, drafts: 0, scheduled: 0, views: 0, likes: 0, comments: 0, shares: 0, bookmarks: 0 },
      subscribers: 0, pending_subscribers: 0, users: 0, push_subscribers: 0, reported_comments: 0, categories: [], trending: [], views_last_14_days: [],
    });
    vi.mocked(posts.getAdminTodo).mockResolvedValue({ drafts: [], draft_count: 0, short_posts: [], short_count: 0, closing_jobs: [], unanswered: [], quiz_today: true, products_without_price: 0 });
    renderRoute(<AdminDashboard />);
    expect(await screen.findByText(/सब काम पूरे हैं/)).toBeInTheDocument();
  });
});
