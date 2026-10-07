// Daily GK quiz (Blueprint Loop 4). Answers are revealed by the submit_quiz RPC only.
import { supabase } from "@/lib/supabase";
import { getVisitorId } from "@/lib/storage";

export interface QuizQuestion {
  id: string;
  quiz_date: string;
  position: number;
  question: string;
  options: string[];
  explanation: string | null;
}

export interface QuizResult {
  score: number;
  total: number;
  results: Array<{ id: string; correct_index: number; chosen: number | null; is_correct: boolean; explanation: string | null }>;
}

export async function getQuiz(date: string): Promise<QuizQuestion[]> {
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("id, quiz_date, position, question, options, explanation")
    .eq("quiz_date", date)
    .order("position");
  if (error) throw error;
  return data ?? [];
}

/** Most recent dates that have a quiz (for the archive). */
export async function recentQuizDates(limit = 7): Promise<string[]> {
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("quiz_date")
    .order("quiz_date", { ascending: false })
    .limit(limit * 20);
  if (error) throw error;
  return Array.from(new Set((data ?? []).map((r) => r.quiz_date))).slice(0, limit);
}

export async function submitQuiz(date: string, answers: Array<number | null>): Promise<QuizResult> {
  const { data, error } = await supabase.rpc("submit_quiz", {
    p_quiz_date: date,
    p_answers: answers.map((a) => (a === null ? -1 : a)),
    p_visitor_id: getVisitorId(),
  });
  if (error) throw error;
  return data as unknown as QuizResult;
}

export interface AdminQuizQuestion extends QuizQuestion {
  correct_index: number;
}

export async function adminGetQuiz(date: string): Promise<AdminQuizQuestion[]> {
  const { data, error } = await supabase.rpc("admin_quiz_questions", { p_quiz_date: date });
  if (error) throw error;
  return (data ?? []) as AdminQuizQuestion[];
}

export async function adminSaveQuiz(date: string, questions: Array<Omit<AdminQuizQuestion, "id" | "quiz_date">>): Promise<void> {
  const { error: delError } = await supabase.from("quiz_questions").delete().eq("quiz_date", date);
  if (delError) throw delError;
  if (!questions.length) return;
  const { error } = await supabase.from("quiz_questions").insert(
    questions.map((q, i) => ({
      quiz_date: date,
      position: i + 1,
      question: q.question.trim(),
      options: q.options.map((o) => o.trim()),
      correct_index: q.correct_index,
      explanation: q.explanation?.trim() || null,
    })),
  );
  if (error) throw error;
}
