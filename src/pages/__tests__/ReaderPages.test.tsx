import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "@/test/render";
import { signIn } from "@/test/authMock";
import { toast } from "@/test/sonnerMock";
import { listItem } from "@/test/fixtures";
import { saveLocally } from "@/lib/savedPosts";
import { istToday } from "@/lib/format";

vi.mock("@/hooks/useAuth", () => import("@/test/authMock"));
vi.mock("sonner", () => import("@/test/sonnerMock"));
vi.mock("@/services/posts", () => ({ listPosts: vi.fn(async () => ({ items: [], total: 0 })), recordShare: vi.fn() }));
vi.mock("@/services/engagement", () => ({ listBookmarkIds: vi.fn(async () => []), setBookmarked: vi.fn() }));
vi.mock("@/services/tracker", () => ({
  listFollows: vi.fn(async () => []),
  listReminderPostIds: vi.fn(async () => []),
  recruitmentTimeline: vi.fn(async () => []),
}));
vi.mock("@/services/quiz", () => ({ getQuiz: vi.fn(), recentQuizDates: vi.fn(async () => []), submitQuiz: vi.fn() }));
vi.mock("@/services/comments", async (orig) => ({
  ...(await orig<typeof import("@/services/comments")>()),
  getThreads: vi.fn(async () => []),
  postComment: vi.fn(async () => undefined),
  reportComment: vi.fn(async () => undefined),
  deleteComment: vi.fn(async () => undefined),
  moderateComment: vi.fn(async () => undefined),
}));

const posts = await import("@/services/posts");
const engagement = await import("@/services/engagement");
const tracker = await import("@/services/tracker");
const quiz = await import("@/services/quiz");
const comments = await import("@/services/comments");
const { default: MyJobs } = await import("@/pages/MyJobs");
const { default: Quiz } = await import("@/pages/Quiz");
const { QaSection } = await import("@/components/post/QaSection");

describe("My Jobs", () => {
  it("guest with no saves sees how to save", async () => {
    renderRoute(<MyJobs />, { route: "/my" });
    expect(await screen.findByText("अभी कोई सेव नहीं")).toBeInTheDocument();
    expect(posts.listPosts).not.toHaveBeenCalledWith(expect.objectContaining({ ids: expect.arrayContaining(["x"]) }));
  });

  it("guest saves are listed, open jobs before closed, with a sync prompt", async () => {
    const open = listItem({ title: "खुली भर्ती" });
    const closed = listItem({ title: "बंद भर्ती", job_status: "closed", days_left: -1 });
    saveLocally(open.id);
    saveLocally(closed.id);
    vi.mocked(posts.listPosts).mockResolvedValue({ items: [closed, open], total: 2 });
    renderRoute(<MyJobs />, { route: "/my" });
    const links = await screen.findAllByRole("link", { name: /भर्ती$/ });
    expect(links.map((l) => l.textContent)).toEqual(["खुली भर्ती", "बंद भर्ती"]);
    expect(screen.getByRole("tab", { name: /सेव\(2\)|सेव \(2\)|सेव/ })).toHaveTextContent("(2)");
    expect(screen.getByRole("link", { name: "साइन इन करें" })).toHaveAttribute("href", "/login?redirect=%2Fmy");
  });

  it("guest tracker and reminders tabs ask to sign in", async () => {
    renderRoute(<MyJobs />, { route: "/my" });
    await userEvent.click(screen.getByRole("tab", { name: "आवेदन / फॉलो" }));
    expect(screen.getByText("आवेदन ट्रैकर के लिए साइन इन करें")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "रिमाइंडर" }));
    expect(screen.getByText("रिमाइंडर इसी फ़ोन पर हैं")).toBeInTheDocument();
  });

  it("signed-in tracker shows progress and the next action", async () => {
    signIn("user", "u1");
    vi.mocked(engagement.listBookmarkIds).mockResolvedValue([]);
    vi.mocked(tracker.listFollows).mockResolvedValue([
      { recruitment_id: "r1", applied: true, applied_at: null, created_at: "", recruitment: { id: "r1", name: "पुलिस कांस्टेबल 2026", organisation: "राजस्थान पुलिस" } },
    ]);
    vi.mocked(tracker.recruitmentTimeline).mockResolvedValue([
      { recruitment_id: "r1", last_date: null, exam_date: null, admit_card_date: null, result_date: null, post: { id: "p1", title: "भर्ती", slug: "police-job", post_type: "job", published_at: null } },
      { recruitment_id: "r1", last_date: null, exam_date: null, admit_card_date: null, result_date: null, post: { id: "p2", title: "एडमिट", slug: "police-admit", post_type: "admit_card", published_at: null } },
    ] as never);
    renderRoute(<MyJobs />, { route: "/my" });
    await userEvent.click(screen.getByRole("tab", { name: "आवेदन / फॉलो" }));
    expect(await screen.findByText("पुलिस कांस्टेबल 2026")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "एडमिट कार्ड डाउनलोड करें" })).toHaveAttribute("href", "/blog/police-admit");
    const steps = within(screen.getByRole("list", { name: "प्रगति" })).getAllByRole("listitem");
    expect(steps.map((s) => s.textContent?.includes("पूरा"))).toEqual([true, true, false, false]);
  });

  it("signed-in with no reminders sees the empty state", async () => {
    signIn("user", "u1");
    renderRoute(<MyJobs />, { route: "/my" });
    await userEvent.click(screen.getByRole("tab", { name: "रिमाइंडर" }));
    expect(await screen.findByText("कोई रिमाइंडर नहीं")).toBeInTheDocument();
  });
});

describe("Daily quiz", () => {
  const questions = [
    { id: "q1", quiz_date: istToday(), position: 1, question: "राजस्थान की राजधानी?", options: ["जोधपुर", "जयपुर", "बाड़मेर", "अजमेर"], explanation: null },
    { id: "q2", quiz_date: istToday(), position: 2, question: "बाड़मेर किस दिशा में?", options: ["उत्तर", "पूर्व", "पश्चिम", "दक्षिण"], explanation: null },
  ];

  it("submit is disabled until every question is answered, then shows score, answers and streak", async () => {
    vi.mocked(quiz.getQuiz).mockResolvedValue(questions);
    vi.mocked(quiz.submitQuiz).mockResolvedValue({
      score: 1,
      total: 2,
      results: [
        { id: "q1", correct_index: 1, chosen: 1, is_correct: true, explanation: "जयपुर 1949 से राजधानी है।" },
        { id: "q2", correct_index: 2, chosen: 0, is_correct: false, explanation: null },
      ],
    });
    renderRoute(<Quiz />, { route: "/quiz" });
    const submit = await screen.findByRole("button", { name: "सभी 2 सवालों के जवाब चुनें" });
    expect(submit).toBeDisabled();
    await userEvent.click(screen.getByLabelText("जयपुर"));
    expect(screen.getByRole("button", { name: "सभी 2 सवालों के जवाब चुनें" })).toBeDisabled();
    await userEvent.click(screen.getByLabelText("उत्तर"));
    await userEvent.click(screen.getByRole("button", { name: "जवाब जमा करें" }));
    expect(quiz.submitQuiz).toHaveBeenCalledWith(istToday(), [1, 0]);
    expect(await screen.findByRole("status")).toHaveTextContent("1/2");
    expect(screen.getByText("💡 जयपुर 1949 से राजधानी है।")).toBeInTheDocument();
    // Correct option is marked on every question; the wrong pick only on question 2.
    expect(screen.getAllByLabelText("सही", { selector: "svg" })).toHaveLength(2);
    expect(screen.getAllByLabelText("गलत", { selector: "svg" })).toHaveLength(1);
    expect(screen.getByLabelText("1 दिन की स्ट्रीक")).toBeInTheDocument();
    expect(screen.getByLabelText("जयपुर")).toBeDisabled();
    expect(JSON.parse(localStorage.getItem("malani-quiz-results")!)).toEqual({ [istToday()]: { score: 1, total: 2 } });
    expect(screen.getByRole("link", { name: /दोस्तों को चुनौती दें/ }).getAttribute("href")).toContain(encodeURIComponent("1/2"));
  });

  it("shows a friendly message when today's quiz is not published yet", async () => {
    vi.mocked(quiz.getQuiz).mockResolvedValue([]);
    renderRoute(<Quiz />, { route: "/quiz" });
    expect(await screen.findByText("आज की क्विज़ जल्द आएगी")).toBeInTheDocument();
  });

  it("submit errors keep the answers and show a toast", async () => {
    vi.mocked(quiz.getQuiz).mockResolvedValue([questions[0]]);
    vi.mocked(quiz.submitQuiz).mockRejectedValue(new Error("offline"));
    renderRoute(<Quiz />, { route: "/quiz" });
    await userEvent.click(await screen.findByLabelText("जयपुर"));
    await userEvent.click(screen.getByRole("button", { name: "जवाब जमा करें" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("जवाब जमा नहीं हो सके। दोबारा कोशिश करें।"));
    expect(screen.getByLabelText("जयपुर")).toBeChecked();
  });

  it("previous days can be played from the archive", async () => {
    vi.mocked(quiz.recentQuizDates).mockResolvedValue([istToday(), "2026-01-15"]);
    vi.mocked(quiz.getQuiz).mockResolvedValue([]);
    renderRoute(<Quiz />, { route: "/quiz" });
    await userEvent.click(await screen.findByRole("button", { name: "15 जन" }));
    await waitFor(() => expect(quiz.getQuiz).toHaveBeenLastCalledWith("2026-01-15"));
  });
});

describe("Q&A section", () => {
  const thread = (over: Record<string, unknown> = {}) => ({
    id: "c1",
    post_id: "p",
    user_id: "other",
    parent_id: null,
    content: "क्या 12वीं के छात्र आवेदन कर सकते हैं?",
    is_pinned: false,
    is_hidden: false,
    created_at: new Date().toISOString(),
    author: { id: "other", full_name: "सुरेश", avatar_url: null },
    isAdminAnswer: false,
    replies: [],
    ...over,
  });

  it("signed-in reader asks a question; box clears and list refreshes", async () => {
    signIn("user", "u1");
    renderRoute(<QaSection postId="p" returnPath="/blog/x" />);
    const box = await screen.findByLabelText("आपका सवाल");
    expect(screen.getByRole("button", { name: "सवाल पूछें" })).toBeDisabled();
    await userEvent.type(box, "  अंतिम तिथि क्या है?  ");
    await userEvent.click(screen.getByRole("button", { name: "सवाल पूछें" }));
    expect(comments.postComment).toHaveBeenCalledWith({ postId: "p", userId: "u1", content: "  अंतिम तिथि क्या है?  ", parentId: null });
    await waitFor(() => expect(box).toHaveValue(""));
    expect(comments.getThreads).toHaveBeenCalledTimes(2);
  });

  it("rate-limit errors are explained in Hindi", async () => {
    signIn("user", "u1");
    vi.mocked(comments.postComment).mockRejectedValueOnce({ message: "RATE_LIMIT" });
    renderRoute(<QaSection postId="p" returnPath="/blog/x" />);
    await userEvent.type(await screen.findByLabelText("आपका सवाल"), "सवाल");
    await userEvent.click(screen.getByRole("button", { name: "सवाल पूछें" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("कुछ मिनट बाद")));
  });

  it("admin answers are badged; readers can report others but not their own", async () => {
    signIn("user", "u1");
    vi.mocked(comments.getThreads).mockResolvedValue([
      thread({ replies: [thread({ id: "a1", parent_id: "c1", user_id: "admin", content: "हाँ, कर सकते हैं।", is_pinned: true, isAdminAnswer: true, author: { id: "admin", full_name: "टीम", avatar_url: null } })] }),
      thread({ id: "mine", user_id: "u1", content: "मेरा सवाल", author: { id: "u1", full_name: "राम", avatar_url: null } }),
    ]);
    renderRoute(<QaSection postId="p" returnPath="/blog/x" />);
    expect(await screen.findByText(/उत्तर — मालाणी टीम/)).toBeInTheDocument();
    const [first, mine] = screen.getAllByRole("article");
    await userEvent.click(within(first).getAllByRole("button", { name: /रिपोर्ट/ })[0]);
    expect(comments.reportComment).toHaveBeenCalledWith("c1", "u1");
    expect(within(mine).queryByRole("button", { name: /रिपोर्ट/ })).not.toBeInTheDocument();
    expect(within(mine).getByRole("button", { name: /हटाएँ/ })).toBeInTheDocument();
  });

  it("replying opens a box under the question", async () => {
    signIn("user", "u1");
    vi.mocked(comments.getThreads).mockResolvedValue([thread()]);
    renderRoute(<QaSection postId="p" returnPath="/blog/x" />);
    await userEvent.click(await screen.findByRole("button", { name: "जवाब दें" }));
    await userEvent.type(screen.getByPlaceholderText("जवाब लिखें…"), "मेरा जवाब");
    await userEvent.click(screen.getAllByRole("button", { name: "जवाब दें" })[0]);
    expect(comments.postComment).toHaveBeenCalledWith(expect.objectContaining({ parentId: "c1", content: "मेरा जवाब" }));
  });

  it("admins can pin and hide", async () => {
    signIn("admin", "admin");
    vi.mocked(comments.getThreads).mockResolvedValue([thread()]);
    renderRoute(<QaSection postId="p" returnPath="/blog/x" />);
    await userEvent.click(await screen.findByRole("button", { name: /पिन करें/ }));
    expect(comments.moderateComment).toHaveBeenCalledWith("c1", { pinned: true });
    await userEvent.click(screen.getByRole("button", { name: /छिपाएँ/ }));
    expect(comments.moderateComment).toHaveBeenCalledWith("c1", { hidden: true });
  });

  it("empty threads invite the first question", async () => {
    vi.mocked(comments.getThreads).mockResolvedValue([]);
    renderRoute(<QaSection postId="p" returnPath="/blog/x" />);
    expect(await screen.findByText("अभी कोई सवाल नहीं। पहला सवाल आप पूछें!")).toBeInTheDocument();
  });
});
