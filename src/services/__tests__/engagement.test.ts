import { describe, expect, it, vi } from "vitest";
import { opArgs, sb } from "@/test/supabaseMock";
import { loadSavedIds, saveLocally } from "@/lib/savedPosts";

vi.mock("@/lib/supabase", async () => ({ supabase: (await import("@/test/supabaseMock")).sb.supabase }));
vi.mock("@/lib/push", () => ({ currentSubscription: vi.fn(async () => null) }));

const engagement = await import("@/services/engagement");
const comments = await import("@/services/comments");
const tracker = await import("@/services/tracker");
const quiz = await import("@/services/quiz");
const notifications = await import("@/services/notifications");
const push = await import("@/lib/push");

describe("likes and bookmarks", () => {
  it("hasLiked counts rows for the user", async () => {
    sb.on({ name: "post_likes" }, { count: 1 });
    expect(await engagement.hasLiked("p", "u")).toBe(true);
    sb.on({ name: "post_likes" }, { count: 0 });
    expect(await engagement.hasLiked("p", "u")).toBe(false);
  });

  it("liking twice (unique violation) is not an error; other errors are", async () => {
    sb.on({ name: "post_likes", method: "insert" }, { error: { code: "23505" } });
    await expect(engagement.setLiked("p", "u", true)).resolves.toBeUndefined();
    sb.on({ name: "post_likes", method: "insert" }, { error: { code: "42501", message: "rls" } });
    await expect(engagement.setLiked("p", "u", true)).rejects.toMatchObject({ code: "42501" });
  });

  it("unlike deletes only the user's row", async () => {
    await engagement.setLiked("p", "u", false);
    expect(sb.find("post_likes", "delete")[0].ops.filter((o) => o.method === "eq").map((o) => o.args)).toEqual([["post_id", "p"], ["user_id", "u"]]);
  });

  it("bookmarks list newest first and save/remove", async () => {
    sb.on({ name: "post_bookmarks", method: "select" }, { data: [{ post_id: "b" }, { post_id: "a" }] });
    expect(await engagement.listBookmarkIds("u")).toEqual(["b", "a"]);
    await engagement.setBookmarked("p", "u", true);
    await engagement.setBookmarked("p", "u", false);
    expect(sb.find("post_bookmarks", "insert")).toHaveLength(1);
    expect(sb.find("post_bookmarks", "delete")).toHaveLength(1);
  });

  it("syncLocalSaves moves guest saves into the account and clears them", async () => {
    expect(await engagement.syncLocalSaves("u")).toBe(0);
    saveLocally("p1");
    saveLocally("p2");
    expect(await engagement.syncLocalSaves("u")).toBe(2);
    expect(opArgs(sb.find("post_bookmarks", "upsert")[0], "upsert")).toEqual([
      [{ post_id: "p2", user_id: "u" }, { post_id: "p1", user_id: "u" }],
      { onConflict: "post_id,user_id", ignoreDuplicates: true },
    ]);
    expect(loadSavedIds()).toEqual([]);
  });

  it("syncLocalSaves keeps local saves when the upload fails", async () => {
    saveLocally("p1");
    sb.on({ name: "post_bookmarks" }, { error: { message: "offline" } });
    await expect(engagement.syncLocalSaves("u")).rejects.toBeTruthy();
    expect(loadSavedIds()).toEqual(["p1"]);
  });
});

describe("comments / Q&A", () => {
  const row = (id: string, extra: Record<string, unknown> = {}) => ({
    id,
    post_id: "p",
    user_id: "reader",
    parent_id: null,
    content: id,
    is_pinned: false,
    is_hidden: false,
    created_at: "2026-10-01T00:00:00Z",
    ...extra,
  });

  it("builds threads: pinned/answered first, newest next, replies attached, authors joined", async () => {
    sb.on({ name: "comments" }, {
      data: [
        row("old", { created_at: "2026-10-01T00:00:00Z" }),
        row("new", { created_at: "2026-10-03T00:00:00Z" }),
        row("answered", { created_at: "2026-09-01T00:00:00Z" }),
        row("ans", { parent_id: "answered", user_id: "admin", is_pinned: true, created_at: "2026-09-02T00:00:00Z" }),
        row("reply", { parent_id: "new", created_at: "2026-10-04T00:00:00Z" }),
      ],
    });
    sb.on({ name: "profiles" }, { data: [{ id: "reader", full_name: "राम", avatar_url: null }, { id: "admin", full_name: "टीम", avatar_url: null }] });
    const threads = await comments.getThreads("p");
    expect(threads.map((t) => t.id)).toEqual(["answered", "new", "old"]);
    expect(threads[0].replies[0]).toMatchObject({ id: "ans", isAdminAnswer: true, author: { full_name: "टीम" } });
    expect(threads[1].replies.map((r) => r.id)).toEqual(["reply"]);
    expect(threads[2].author?.full_name).toBe("राम");
  });

  it("marks replies from known admins as answers even when not pinned", async () => {
    sb.on({ name: "comments" }, { data: [row("q"), row("a", { parent_id: "q", user_id: "admin" })] });
    const [t] = await comments.getThreads("p", ["admin"]);
    expect(t.replies[0].isAdminAnswer).toBe(true);
  });

  it("validates and trims before posting", async () => {
    await expect(comments.postComment({ postId: "p", userId: "u", content: "   " })).rejects.toThrow("comments_content_length");
    await expect(comments.postComment({ postId: "p", userId: "u", content: "a".repeat(2001) })).rejects.toThrow("comments_content_length");
    expect(sb.supabase.from).not.toHaveBeenCalled();
    await comments.postComment({ postId: "p", userId: "u", content: "  सवाल  ", parentId: "q" });
    expect(opArgs(sb.find("comments", "insert")[0], "insert")).toEqual([{ post_id: "p", user_id: "u", content: "सवाल", parent_id: "q" }]);
  });

  it("translates database errors into Hindi", () => {
    expect(comments.friendlyCommentError({ message: "RATE_LIMIT: slow down" })).toContain("कुछ मिनट बाद");
    expect(comments.friendlyCommentError(new Error("comments_content_length"))).toContain("2000");
    expect(comments.friendlyCommentError({ message: "Comments are closed" })).toContain("नहीं पूछे जा सकते");
    expect(comments.friendlyCommentError(null)).toContain("दोबारा कोशिश");
  });

  it("reporting twice is fine, reason is capped at 300 chars", async () => {
    sb.on({ name: "comment_reports" }, { error: { code: "23505" } });
    await expect(comments.reportComment("c", "u", "x".repeat(400))).resolves.toBeUndefined();
    expect((opArgs(sb.find("comment_reports")[0], "insert")?.[0] as { reason: string }).reason).toHaveLength(300);
  });

  it("moderation calls the RPC and the queue sorts reported first", async () => {
    await comments.moderateComment("c", { pinned: true });
    expect(sb.supabase.rpc).toHaveBeenCalledWith("moderate_comment", { p_comment_id: "c", p_hidden: undefined, p_pinned: true });

    sb.on({ name: "comments" }, {
      data: [
        { ...row("calm", { created_at: "2026-10-05T00:00:00Z" }), posts: { title: "T", slug: "t" } },
        { ...row("hot", { created_at: "2026-10-01T00:00:00Z" }), posts: [{ title: "T2", slug: "t2" }] },
      ],
    });
    sb.on({ name: "comment_reports" }, { data: [{ comment_id: "hot" }, { comment_id: "hot" }] });
    const queue = await comments.getModerationQueue();
    expect(queue.map((q) => [q.id, q.reports, q.post?.slug])).toEqual([["hot", 2, "t2"], ["calm", 0, "t"]]);
  });
});

describe("tracker and reminders", () => {
  it("listFollows flattens the joined recruitment", async () => {
    sb.on({ name: "recruitment_follows" }, { data: [{ recruitment_id: "r", applied: true, recruitments: [{ id: "r", name: "N", organisation: "O" }] }] });
    expect((await tracker.listFollows("u"))[0].recruitment).toEqual({ id: "r", name: "N", organisation: "O" });
  });

  it("follow/applied use upserts keyed on user+recruitment", async () => {
    await tracker.setFollow("r", "u", true);
    await tracker.setApplied("r", "u", true);
    await tracker.setFollow("r", "u", false);
    const [follow, applied] = sb.find("recruitment_follows", "upsert");
    expect(opArgs(follow, "upsert")?.[1]).toEqual({ onConflict: "user_id,recruitment_id", ignoreDuplicates: true });
    expect(opArgs(applied, "upsert")?.[0]).toMatchObject({ applied: true, applied_at: expect.any(String) });
    expect(sb.find("recruitment_follows", "delete")).toHaveLength(1);
  });

  it("recruitment timeline skips the query for no ids", async () => {
    expect(await tracker.recruitmentTimeline([])).toEqual([]);
    expect(sb.supabase.from).not.toHaveBeenCalled();
  });

  it("account reminders insert/delete; guests need push", async () => {
    await tracker.setReminder("p", "u", true);
    await tracker.setReminder("p", "u", false);
    expect(sb.find("job_reminders", "insert")).toHaveLength(1);
    expect(sb.find("job_reminders", "delete")).toHaveLength(1);

    await expect(tracker.setReminder("p", null, true)).rejects.toThrow("NEEDS_PUSH");
    vi.mocked(push.currentSubscription).mockResolvedValueOnce({ endpoint: "https://fcm.googleapis.com/fcm/send/x" } as PushSubscription);
    await tracker.setReminder("p", null, true);
    expect(sb.supabase.rpc).toHaveBeenCalledWith("set_push_reminder", { p_post_id: "p", p_endpoint: "https://fcm.googleapis.com/fcm/send/x", p_enabled: true });
  });

  it("reminderIcs is a valid calendar event with a 1-day alarm and escaped text", () => {
    const ics = tracker.reminderIcs("RPSC; भर्ती, 2026", "2026-10-25", "https://malanibarmer.com/blog/rpsc");
    const lines = ics.split("\r\n");
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines.at(-1)).toBe("END:VCALENDAR");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261025");
    expect(ics).toContain("TRIGGER:-P1D");
    expect(ics).toContain("SUMMARY:अंतिम तिथि: RPSC\\; भर्ती\\, 2026");
    expect(ics).toContain("URL:https://malanibarmer.com/blog/rpsc");
  });
});

describe("quiz", () => {
  it("unanswered questions are sent as -1 with the visitor id", async () => {
    sb.on({ name: "submit_quiz" }, { data: { score: 1, total: 2, results: [] } });
    expect(await quiz.submitQuiz("2026-10-06", [1, null])).toEqual({ score: 1, total: 2, results: [] });
    expect(sb.supabase.rpc).toHaveBeenCalledWith("submit_quiz", { p_quiz_date: "2026-10-06", p_answers: [1, -1], p_visitor_id: expect.any(String) });
  });

  it("recent dates are unique and limited", async () => {
    sb.on({ name: "quiz_questions" }, { data: [{ quiz_date: "c" }, { quiz_date: "c" }, { quiz_date: "b" }, { quiz_date: "a" }] });
    expect(await quiz.recentQuizDates(2)).toEqual(["c", "b"]);
  });

  it("admin save replaces the day's questions with trimmed, numbered rows", async () => {
    await quiz.adminSaveQuiz("2026-10-07", [{ position: 9, question: " Q ", options: [" a ", "b", "c", "d"], correct_index: 2, explanation: "  " }]);
    expect(opArgs(sb.find("quiz_questions", "delete")[0], "eq")).toEqual(["quiz_date", "2026-10-07"]);
    expect(opArgs(sb.find("quiz_questions", "insert")[0], "insert")).toEqual([
      [{ quiz_date: "2026-10-07", position: 1, question: "Q", options: ["a", "b", "c", "d"], correct_index: 2, explanation: null }],
    ]);
  });

  it("admin save with no questions only deletes; delete errors stop the save", async () => {
    await quiz.adminSaveQuiz("d", []);
    expect(sb.find("quiz_questions", "insert")).toHaveLength(0);
    sb.on({ name: "quiz_questions", method: "delete" }, { error: { message: "rls" } });
    await expect(quiz.adminSaveQuiz("d", [])).rejects.toEqual({ message: "rls" });
  });
});

describe("notifications", () => {
  it("flattens the joined post and counts unread", async () => {
    sb.on({ name: "user_notifications", method: "order" }, { data: [{ id: "n", title: "T", posts: [{ slug: "s", title: "P" }] }] });
    expect((await notifications.listNotifications("u"))[0].post).toEqual({ slug: "s", title: "P" });
    sb.on({ name: "user_notifications", method: "is" }, { count: 3 });
    expect(await notifications.unreadCount("u")).toBe(3);
    await notifications.markNotificationsRead();
    expect(sb.supabase.rpc).toHaveBeenCalledWith("mark_notifications_read", { p_ids: undefined });
  });
});
