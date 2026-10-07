import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ViewsChart } from "@/components/admin/ViewsChart";
import { getAdminAnalytics } from "@/services/posts";
import { queryKeys } from "@/lib/queryClient";
import { formatNumber } from "@/lib/format";

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="font-hindi text-small text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular">{formatNumber(value)}</p>
      {hint && <p className="font-hindi text-caption font-normal text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const analytics = useQuery({ queryKey: queryKeys.analytics, queryFn: getAdminAnalytics });
  const a = analytics.data;

  if (analytics.isError) return <p className="font-hindi text-destructive">आँकड़े लोड नहीं हो सके।</p>;
  if (!a) return <p className="font-hindi text-muted-foreground">आँकड़े लोड हो रहे हैं…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-hindi text-2xl font-bold">डैशबोर्ड</h1>
        <Button asChild className="font-hindi"><Link to="/admin/posts/new">नई पोस्ट लिखें</Link></Button>
      </div>

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
