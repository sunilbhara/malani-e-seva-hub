import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, CheckCircle2, Flame, Share2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import { EmptyState } from "@/components/common/EmptyState";
import { getQuiz, recentQuizDates, submitQuiz, type QuizResult } from "@/services/quiz";
import { queryKeys } from "@/lib/queryClient";
import { formatDate, istToday } from "@/lib/format";
import { readJson, writeJson } from "@/lib/storage";
import { whatsappShareUrl } from "@/lib/share";
import { BUSINESS } from "@/lib/business";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { quizStreak, type StoredResults } from "@/lib/quizHelpers";

const RESULTS_KEY = "malani-quiz-results";


/** Daily Rajasthan GK quiz with streaks and a shareable score (Blueprint Loop 4). */
export default function Quiz() {
  const today = istToday();
  const [date, setDate] = useState(today);
  const [answers, setAnswers] = useState<Array<number | null>>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stored, setStored] = useState<StoredResults>(() => readJson<StoredResults>(RESULTS_KEY, {}));

  const quiz = useQuery({ queryKey: queryKeys.quiz(date), queryFn: () => getQuiz(date) });
  const dates = useQuery({ queryKey: ["quiz-dates"], queryFn: () => recentQuizDates(7) });

  useEffect(() => {
    setAnswers(new Array(quiz.data?.length ?? 0).fill(null));
    setResult(null);
  }, [quiz.data, date]);

  const streak = useMemo(() => quizStreak(stored, today), [stored, today]);
  const questions = quiz.data ?? [];
  const allAnswered = answers.length > 0 && answers.every((a) => a !== null);

  async function onSubmit() {
    setSubmitting(true);
    try {
      const res = await submitQuiz(date, answers);
      setResult(res);
      const next = { ...stored, [date]: { score: res.score, total: res.total } };
      setStored(next);
      writeJson(RESULTS_KEY, next);
      track("quiz_complete", { score: res.score, total: res.total });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("जवाब जमा नहीं हो सके। दोबारा कोशिश करें।");
    } finally {
      setSubmitting(false);
    }
  }

  const shareMessage = result
    ? `मैंने आज की राजस्थान GK क्विज़ में ${result.score}/${result.total} सही किए! 🔥 ${streak} दिन की स्ट्रीक। आप भी खेलें: ${BUSINESS.siteUrl}/quiz`
    : "";

  return (
    <div className="container-page max-w-3xl py-6">
      <SEO
        title="डेली राजस्थान GK क्विज़ — सरकारी परीक्षा की तैयारी | मालाणी बाड़मेर"
        description="हर दिन 5 सवाल: राजस्थान GK और करंट अफेयर्स। पटवारी, पुलिस, REET और RPSC की तैयारी के लिए मुफ़्त अभ्यास।"
        path="/quiz"
        lang="hi"
      />
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-hindi text-2xl font-bold sm:text-3xl">डेली GK क्विज़</h1>
          <p className="mt-1 font-hindi text-small text-muted-foreground">{formatDate(date, { long: true })} · हर दिन नए सवाल</p>
        </div>
        {streak > 0 && (
          <div className="flex shrink-0 flex-col items-center rounded-xl border bg-accent-soft px-4 py-2" aria-label={`${streak} दिन की स्ट्रीक`}>
            <Flame aria-hidden className="h-6 w-6 text-accent" />
            <span className="font-hindi text-caption tabular">{streak} दिन</span>
          </div>
        )}
      </header>

      {(dates.data?.length ?? 0) > 1 && (
        <div className="-mx-4 mt-4 overflow-x-auto px-4 scrollbar-none">
          <div className="flex gap-2">
            {dates.data!.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDate(d)}
                aria-pressed={d === date}
                className={cn("h-9 shrink-0 rounded-full border px-3.5 font-hindi text-small font-semibold", d === date ? "border-primary bg-primary text-primary-foreground" : "bg-card")}
              >
                {d === today ? "आज" : formatDate(d, { withYear: false })}
                {stored[d] ? " ✓" : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <section role="status" className="mt-6 rounded-2xl border bg-secondary/50 p-5 text-center">
          <p className="font-hindi text-small text-muted-foreground">आपका स्कोर</p>
          <p className="font-hindi text-4xl font-bold tabular">{result.score}/{result.total}</p>
          <p className="mt-1 font-hindi text-small text-body">{result.score === result.total ? "शानदार! सभी सही 🎉" : "बढ़िया कोशिश! नीचे सही जवाब देखें।"}</p>
          <Button asChild variant="whatsapp" className="mt-4 font-hindi">
            <a href={whatsappShareUrl(shareMessage)} target="_blank" rel="noopener noreferrer"><Share2 /> दोस्तों को चुनौती दें</a>
          </Button>
        </section>
      )}

      <div className="mt-6 space-y-4">
        {quiz.isLoading && <p className="font-hindi text-small text-muted-foreground">सवाल लोड हो रहे हैं…</p>}
        {!quiz.isLoading && questions.length === 0 && (
          <EmptyState icon={Brain} title="आज की क्विज़ जल्द आएगी" description="नए सवाल हर सुबह जोड़े जाते हैं। तब तक पिछले दिनों की क्विज़ खेलें।" />
        )}
        {questions.map((q, qi) => {
          const res = result?.results[qi];
          return (
            <fieldset key={q.id} className="rounded-2xl border bg-card p-4">
              <legend className="sr-only">सवाल {qi + 1}</legend>
              <p className="font-hindi text-body font-semibold">
                <span className="mr-1 text-muted-foreground tabular">{qi + 1}.</span> {q.question}
              </p>
              <div className="mt-3 grid gap-2">
                {q.options.map((option, oi) => {
                  const chosen = answers[qi] === oi;
                  const correct = res && res.correct_index === oi;
                  const wrong = res && chosen && !res.is_correct;
                  return (
                    <label
                      key={oi}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 font-hindi text-body transition-colors",
                        !res && chosen && "border-primary bg-secondary",
                        !res && !chosen && "hover:bg-muted",
                        correct && "border-status-open bg-status-open-bg text-status-open",
                        wrong && "border-status-urgent bg-status-urgent-bg text-status-urgent",
                        res && "cursor-default",
                      )}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        className="h-4 w-4 accent-[hsl(var(--primary))]"
                        checked={chosen}
                        disabled={Boolean(result)}
                        onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                      />
                      <span className="flex-1">{option}</span>
                      {correct && <CheckCircle2 aria-label="सही" className="h-5 w-5" />}
                      {wrong && <XCircle aria-label="गलत" className="h-5 w-5" />}
                    </label>
                  );
                })}
              </div>
              {res?.explanation && <p className="mt-3 rounded-xl bg-muted px-3 py-2 font-hindi text-small text-body">💡 {res.explanation}</p>}
            </fieldset>
          );
        })}
      </div>

      {questions.length > 0 && !result && (
        <Button type="button" size="lg" className="mt-6 w-full font-hindi" disabled={!allAnswered || submitting} onClick={() => void onSubmit()}>
          {submitting ? "जाँच रहे हैं…" : allAnswered ? "जवाब जमा करें" : `सभी ${questions.length} सवालों के जवाब चुनें`}
        </Button>
      )}
    </div>
  );
}
