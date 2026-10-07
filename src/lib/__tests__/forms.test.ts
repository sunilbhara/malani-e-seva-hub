import { describe, expect, it } from "vitest";
import { blankQuizDraft, quizProblems, quizStreak } from "@/lib/quizHelpers";
import { validatePostForm, type PostFormState } from "@/lib/postForm";
import { baseSlug } from "@/lib/slug";

describe("quiz", () => {
  it("streak counts consecutive days ending today or yesterday", () => {
    const r = { "2026-10-04": { score: 3, total: 5 }, "2026-10-05": { score: 4, total: 5 } };
    expect(quizStreak(r, "2026-10-06")).toBe(2);
    expect(quizStreak({ ...r, "2026-10-06": { score: 5, total: 5 } }, "2026-10-06")).toBe(3);
    expect(quizStreak(r, "2026-10-08")).toBe(0);
  });
  it("admin validation catches empty and duplicate options", () => {
    expect(quizProblems([blankQuizDraft()])).toHaveLength(3);
    const ok = { question: "राजस्थान की राजधानी?", options: ["जयपुर", "जोधपुर", "बाड़मेर", "अजमेर"], correct_index: 0, explanation: "" };
    expect(quizProblems([ok])).toEqual([]);
    expect(quizProblems([{ ...ok, options: ["a", "a", "b", "c"] }])).toEqual(["सवाल 1: विकल्प अलग-अलग होने चाहिए।"]);
  });
});

describe("post editor validation", () => {
  const base: PostFormState = {
    title: "RPSC भर्ती 2026",
    content: "<p>विवरण</p>",
    postType: "job",
    category: "Government Job",
    tags: "",
    imageUrl: "",
    seoTitle: "",
    seoDescription: "",
    sourceUrl: "",
    officialLink: "",
    isVerified: false,
    language: "hi",
    status: "published",
    scheduledAt: "",
    hasJob: true,
    recruitmentId: "",
    organisation: "RPSC",
    totalPosts: "100",
    qualifications: [],
    departments: [],
    state: "rajasthan",
    ageMin: "18",
    ageMax: "40",
    salary: "",
    fees: [],
    applyStart: "2026-10-01",
    lastDate: "2026-10-30",
    feeLastDate: "",
    admitCardDate: "",
    examDate: "",
    resultDate: "",
    extraDates: [],
    applyLink: "",
    notificationPdf: "",
    officialWebsite: "",
  };

  it("accepts a valid job post", () => expect(validatePostForm(base)).toEqual([]));
  it("requires title and body", () => {
    expect(validatePostForm({ ...base, title: " ", content: "<p> </p>" })).toEqual(["शीर्षक लिखें।", "पोस्ट का विवरण लिखें।"]);
  });
  it("rejects unsafe links", () => {
    expect(validatePostForm({ ...base, applyLink: "javascript:alert(1)" })).toEqual(["आवेदन लिंक: केवल https:// वाला लिंक डालें।"]);
  });
  it("checks date order, age order and post count", () => {
    expect(validatePostForm({ ...base, applyStart: "2026-11-01", ageMin: "40", ageMax: "18", totalPosts: "-3" })).toHaveLength(3);
  });
  it("scheduled posts need a future time", () => {
    expect(validatePostForm({ ...base, status: "scheduled" })).toContain("शेड्यूल का समय चुनें।");
    expect(validatePostForm({ ...base, status: "scheduled", scheduledAt: "2020-01-01T10:00" })).toContain("शेड्यूल का समय भविष्य में होना चाहिए।");
  });
  it("skips job checks for articles", () => {
    expect(validatePostForm({ ...base, hasJob: false, organisation: "", ageMin: "50" })).toEqual([]);
  });
});

describe("slug", () => {
  it("transliterates Hindi titles", () => {
    expect(baseSlug("राजस्थान पटवारी भर्ती 2026")).toMatch(/^[a-z0-9-]+-2026$/);
    expect(baseSlug("RPSC  RAS — Notice!")).toBe("rpsc-ras-notice");
  });
  it("falls back and limits length", () => {
    expect(baseSlug("!!!")).toBe("post");
    expect(baseSlug("a".repeat(200)).length).toBeLessThanOrEqual(80);
  });
});
