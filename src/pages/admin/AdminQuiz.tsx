import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminGetQuiz, adminSaveQuiz } from "@/services/quiz";
import { formatDate, istToday } from "@/lib/format";
import { blankQuizDraft as blank, quizProblems, type QuizDraft as Draft } from "@/lib/quizHelpers";


/** Daily GK quiz editor: up to 10 questions per day; answers stay hidden from readers until they submit. */
export default function AdminQuiz() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(istToday());
  const [questions, setQuestions] = useState<Draft[]>([blank()]);
  const [saving, setSaving] = useState(false);

  const existing = useQuery({ queryKey: ["admin", "quiz", date], queryFn: () => adminGetQuiz(date) });

  useEffect(() => {
    if (!existing.data) return;
    setQuestions(
      existing.data.length
        ? existing.data.map((q) => ({ question: q.question, options: [...q.options], correct_index: q.correct_index, explanation: q.explanation ?? "" }))
        : [blank()],
    );
  }, [existing.data]);

  const update = (i: number, patch: Partial<Draft>) => setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  async function onSave() {
    const problems = quizProblems(questions);
    if (problems.length) {
      toast.error(problems[0]);
      return;
    }
    setSaving(true);
    try {
      await adminSaveQuiz(date, questions.map((q, i) => ({ ...q, position: i + 1, explanation: q.explanation || null })));
      void queryClient.invalidateQueries({ queryKey: ["admin", "quiz", date] });
      void queryClient.invalidateQueries({ queryKey: ["quiz", date] });
      toast.success(`${formatDate(date)} की क्विज़ सेव हो गई`);
    } catch {
      toast.error("क्विज़ सेव नहीं हो सकी");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="mr-auto font-hindi text-2xl font-bold">डेली GK क्विज़</h1>
        <div className="space-y-1">
          <Label htmlFor="quiz-date" className="font-hindi">तारीख</Label>
          <Input id="quiz-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
        </div>
      </div>
      <p className="font-hindi text-small text-muted-foreground">भविष्य की तारीख की क्विज़ उसी दिन सुबह से दिखेगी। सही जवाब पाठकों को जमा करने के बाद ही दिखता है।</p>

      {questions.map((q, i) => (
        <fieldset key={i} className="space-y-3 rounded-2xl border bg-card p-4">
          <legend className="sr-only">सवाल {i + 1}</legend>
          <div className="flex items-center justify-between">
            <p className="font-hindi font-semibold">सवाल {i + 1}</p>
            {questions.length > 1 && (
              <Button type="button" variant="ghost" size="icon-sm" aria-label="सवाल हटाएँ" onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))}><Trash2 /></Button>
            )}
          </div>
          <Textarea value={q.question} onChange={(e) => update(i, { question: e.target.value })} maxLength={500} placeholder="सवाल लिखें" className="font-hindi" />
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o, oi) => (
              <label key={oi} className="flex items-center gap-2">
                <input type="radio" name={`correct-${i}`} checked={q.correct_index === oi} onChange={() => update(i, { correct_index: oi })} aria-label={`विकल्प ${oi + 1} सही है`} className="h-4 w-4" />
                <Input value={o} onChange={(e) => update(i, { options: q.options.map((x, xi) => (xi === oi ? e.target.value : x)) })} placeholder={`विकल्प ${oi + 1}`} className="h-11 font-hindi" />
              </label>
            ))}
          </div>
          <Input value={q.explanation} onChange={(e) => update(i, { explanation: e.target.value })} maxLength={1000} placeholder="व्याख्या (वैकल्पिक)" className="h-11 font-hindi" />
        </fieldset>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={questions.length >= 10} onClick={() => setQuestions((qs) => [...qs, blank()])} className="font-hindi">
          <Plus /> सवाल जोड़ें
        </Button>
        <Button type="button" onClick={() => void onSave()} disabled={saving} className="font-hindi sm:ml-auto">
          {saving ? "सेव हो रहा है…" : "क्विज़ सेव करें"}
        </Button>
      </div>
    </div>
  );
}
