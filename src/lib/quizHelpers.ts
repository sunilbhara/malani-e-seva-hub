import { istToday } from "@/lib/format";

export type StoredResults = Record<string, { score: number; total: number }>;

/** Consecutive days (ending today or yesterday) with a completed quiz. */
export function quizStreak(results: StoredResults, today = istToday()): number {
  let streak = 0;
  const cursor = new Date(`${today}T00:00:00Z`);
  if (!results[today]) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (results[cursor.toISOString().slice(0, 10)]) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export interface QuizDraft {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export const blankQuizDraft = (): QuizDraft => ({ question: "", options: ["", "", "", ""], correct_index: 0, explanation: "" });

export function quizProblems(questions: QuizDraft[]): string[] {
  const problems: string[] = [];
  questions.forEach((q, i) => {
    if (q.question.trim().length < 5) problems.push(`सवाल ${i + 1}: सवाल लिखें।`);
    if (q.options.some((o) => !o.trim())) problems.push(`सवाल ${i + 1}: चारों विकल्प भरें।`);
    if (new Set(q.options.map((o) => o.trim())).size < 4) problems.push(`सवाल ${i + 1}: विकल्प अलग-अलग होने चाहिए।`);
  });
  return problems;
}
