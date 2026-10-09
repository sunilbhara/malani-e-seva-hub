import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlarmClock, Brain, CheckCircle2, FilePenLine, MessageSquareWarning, Store, TextQuote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/common/Skeleton";
import { ViewsChart } from "@/components/admin/ViewsChart";
import { getAdminAnalytics, getAdminTodo, type AdminTodo } from "@/services/posts";
import { queryKeys } from "@/lib/queryClient";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

function Task({ icon: Icon, tone, title, children }: { icon: typeof AlarmClock; tone: "urgent" | "soon" | "info"; title: string; children?: ReactNode }) {
  return (
    <li className="flex gap-3 rounded-xl border bg-card p-3.5">
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full",
          tone === "urgent" && "bg-status-urgent-bg text-status-urgent",
          tone === "soon" && "bg-status-soon-bg text-status-soon",
          tone === "info" && "bg-secondary text-secondary-foreground",
        )}
      >
        <Icon aria-hidden className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-hindi font-semibold">{title}</p>
        {children}
      </div>
    </li>
  );
}

/** "आज के काम": what needs the owner's attention today, most urgent first. */
function TodoCard({ todo }: { todo: AdminTodo }) {
  const tasks: ReactNode[] = [];
  if (todo.unanswered.length)
    tasks.push(
      <Task key="q" icon={MessageSquareWarning} tone="urgent" title={`${todo.unanswered.length} पाठकों के सवाल का जवाब बाकी`}>
        <ul className="mt-1 space-y-0.5">
          {todo.unanswered.slice(0, 3).map((q) => (
            <li key={q.id} className="truncate font-hindi text-small text-muted-foreground">
              <Link to={`/blog/${q.post_slug}#qa`} className="hover:text-foreground hover:underline">“{q.content}” — {q.post_title}</Link>
            </li>
          ))}
        </ul>
      </Task>,
    );
  if (todo.closing_jobs.length)
    tasks.push(
      <Task key="c" icon={AlarmClock} tone="soon" title={`${todo.closing_jobs.length} भर्तियों की अंतिम तिथि 3 दिन में — तारीख बढ़ी हो तो अपडेट करें`}>
        <ul className="mt-1 space-y-0.5">
          {todo.closing_jobs.slice(0, 4).map((j) => (
            <li key={j.id} className="truncate font-hindi text-small text-muted-foreground">
              <Link to={`/admin/posts/${j.id}`} className="hover:text-foreground hover:underline">{j.title}</Link> · <span className="tabular">{formatDate(j.last_date)}</span>
            </li>
          ))}
        </ul>
      </Task>,
    );
  if (!todo.quiz_today)
    tasks.push(
      <Task key="z" icon={Brain} tone="soon" title="आज की GK क्विज़ नहीं जोड़ी गई">
        <Link to="/admin/quiz" className="font-hindi text-small font-semibold text-link">क्विज़ जोड़ें</Link>
      </Task>,
    );
  if (todo.short_count)
    tasks.push(
      <Task key="s" icon={TextQuote} tone="info" title={`${todo.short_count} पोस्ट 600 शब्द से छोटी — AdSense के लिए बढ़ाएँ`}>
        <ul className="mt-1 space-y-0.5">
          {todo.short_posts.slice(0, 3).map((p) => (
            <li key={p.id} className="truncate font-hindi text-small text-muted-foreground">
              <Link to={`/admin/posts/${p.id}`} className="hover:text-foreground hover:underline">{p.title}</Link> · <span className="tabular">{p.words}</span> शब्द
            </li>
          ))}
        </ul>
      </Task>,
    );
  if (todo.draft_count)
    tasks.push(
      <Task key="d" icon={FilePenLine} tone="info" title={`${todo.draft_count} ड्राफ़्ट अधूरे हैं`}>
        <ul className="mt-1 space-y-0.5">
          {todo.drafts.slice(0, 3).map((p) => (
            <li key={p.id} className="truncate font-hindi text-small text-muted-foreground">
              <Link to={`/admin/posts/${p.id}`} className="hover:text-foreground hover:underline">{p.title || "बिना शीर्षक"}</Link>
            </li>
          ))}
        </ul>
      </Task>,
    );
  if (todo.products_without_price)
    tasks.push(
      <Task key="p" icon={Store} tone="info" title={`${todo.products_without_price} प्रोडक्ट पर दाम नहीं लिखा`}>
        <Link to="/admin/catalog" className="font-hindi text-small font-semibold text-link">दुकान के आइटम खोलें</Link>
      </Task>,
    );

  return (
    <section aria-labelledby="todo-heading" className="space-y-3">
      <h2 id="todo-heading" className="flex items-center gap-2.5 font-hindi text-lg font-bold">
        <span aria-hidden className="h-5 w-1.5 shrink-0 rounded-full bg-accent" />
        आज के काम
      </h2>
      {tasks.length ? (
        <ul className="grid gap-2 lg:grid-cols-2">{tasks}</ul>
      ) : (
        <p className="flex items-center gap-2 rounded-xl border bg-card p-4 font-hindi text-small text-status-open">
          <CheckCircle2 aria-hidden className="h-5 w-5" /> सब काम पूरे हैं — बढ़िया!
        </p>
      )}
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="font-hindi text-small text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular">{formatNumber(value)}</p>
      {hint && <p className="font-hindi text-caption font-normal text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const analytics = useQuery({ queryKey: queryKeys.analytics, queryFn: getAdminAnalytics });
  const todo = useQuery({ queryKey: queryKeys.adminTodo, queryFn: getAdminTodo });
  const a = analytics.data;

  if (analytics.isError) return <p className="font-hindi text-destructive">आँकड़े लोड नहीं हो सके।</p>;
  if (!a)
    return (
      <div className="space-y-4" role="status" aria-busy="true">
        <span className="sr-only">आँकड़े लोड हो रहे हैं…</span>
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-2 lg:grid-cols-2">{Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-hindi text-2xl font-bold">डैशबोर्ड</h1>
        <Button asChild className="font-hindi"><Link to="/admin/posts/new">नई पोस्ट लिखें</Link></Button>
      </div>

      {todo.data ? <TodoCard todo={todo.data} /> : todo.isLoading ? <Skeleton className="h-28 rounded-xl" /> : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="प्रकाशित पोस्ट" value={a.totals.published} hint={`${a.totals.drafts} ड्राफ़्ट · ${a.totals.scheduled} शेड्यूल`} />
        <Stat label="कुल व्यूज़" value={a.totals.views} />
        <Stat label="शेयर" value={a.totals.shares} />
        <Stat label="उपयोगी (लाइक)" value={a.totals.likes} />
        <Stat label="पंजीकृत पाठक" value={a.users} />
        <Stat label="पुश सब्सक्राइबर" value={a.push_subscribers} />
        <Stat label="ईमेल सब्सक्राइबर" value={a.subscribers} hint={a.pending_subscribers ? `${a.pending_subscribers} पुष्टि बाकी` : undefined} />
        <Stat label="रिपोर्ट किए सवाल" value={a.reported_comments} />
      </div>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-hindi text-lg font-bold">रोज़ाना व्यूज़ — पिछले 14 दिन</h2>
        <p className="mb-3 font-hindi text-caption font-normal text-muted-foreground">हर पाठक की एक पोस्ट पर दिन में एक व्यू गिना जाता है।</p>
        <ViewsChart data={a.views_last_14_days} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 font-hindi text-lg font-bold">सबसे लोकप्रिय</h2>
          <ol className="space-y-2">
            {a.trending.map((p, i) => (
              <li key={p.id} className="flex gap-3">
                <span className="w-5 shrink-0 text-muted-foreground tabular">{i + 1}.</span>
                <Link to={`/blog/${p.slug}`} className="min-w-0 flex-1 truncate font-hindi text-small font-medium hover:text-primary">{p.title}</Link>
                <span className="shrink-0 text-caption font-normal text-muted-foreground tabular">{formatNumber(p.views_count)} व्यू</span>
              </li>
            ))}
            {a.trending.length === 0 && <li className="font-hindi text-small text-muted-foreground">अभी कोई डेटा नहीं।</li>}
          </ol>
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 font-hindi text-lg font-bold">कैटेगरी</h2>
          <table className="w-full text-small">
            <thead>
              <tr className="text-left font-hindi text-muted-foreground">
                <th className="pb-2 font-medium">कैटेगरी</th>
                <th className="pb-2 text-right font-medium">पोस्ट</th>
                <th className="pb-2 text-right font-medium">व्यूज़</th>
              </tr>
            </thead>
            <tbody>
              {a.categories.map((c) => (
                <tr key={c.category} className="border-t">
                  <td className="py-2 font-hindi">{c.category}</td>
                  <td className="py-2 text-right tabular">{formatNumber(c.count)}</td>
                  <td className="py-2 text-right tabular">{formatNumber(c.views)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
