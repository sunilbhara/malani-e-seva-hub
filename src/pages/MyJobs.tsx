import { ListSkeleton } from "@/components/common/PageSpinner";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BellRing, Bookmark, CheckCircle2, Circle, ClipboardCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import { EmptyState } from "@/components/common/EmptyState";
import { CardGrid } from "@/components/jobs/PostList";
import { useAuth } from "@/hooks/useAuth";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { listPosts, type PostListItem } from "@/services/posts";
import { listFollows, listReminderPostIds, recruitmentTimeline } from "@/services/tracker";
import { queryKeys } from "@/lib/queryClient";
import { daysUntil, formatDate } from "@/lib/format";
import { loginUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

type Tab = "saved" | "applied" | "reminders";

function sortOpenFirst(items: PostListItem[], order: string[]): PostListItem[] {
  const rank = new Map(order.map((id, i) => [id, i]));
  return [...items].sort((a, b) => {
    const ca = a.job_status === "closed" ? 1 : 0;
    const cb = b.job_status === "closed" ? 1 : 0;
    return ca - cb || (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0);
  });
}

function GuestSyncPrompt() {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-accent/40 bg-accent-soft p-4 sm:flex-row sm:items-center">
      <RefreshCw aria-hidden className="h-5 w-5 shrink-0 text-foreground" />
      <p className="flex-1 font-hindi text-small text-foreground">अपनी सेव की गई नौकरियाँ किसी भी फ़ोन पर देखें — साइन इन करते ही ये आपके खाते में आ जाएँगी।</p>
      <Button asChild className="font-hindi">
        <Link to={loginUrl("/my")}>साइन इन करें</Link>
      </Button>
    </div>
  );
}

const STEPS = [
  { key: "applied", label: "आवेदन" },
  { key: "admit", label: "एडमिट कार्ड" },
  { key: "exam", label: "परीक्षा" },
  { key: "result", label: "रिजल्ट" },
] as const;

function Tracker({ userId }: { userId: string }) {
  const follows = useQuery({ queryKey: queryKeys.follows(userId), queryFn: () => listFollows(userId) });
  const ids = (follows.data ?? []).map((f) => f.recruitment_id);
  const timeline = useQuery({ queryKey: ["timeline", ids], queryFn: () => recruitmentTimeline(ids), enabled: ids.length > 0 });

  if (follows.isLoading) return <ListSkeleton rows={3} />;
  if (!follows.data?.length) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="अभी कोई भर्ती ट्रैक नहीं हो रही"
        description="किसी भर्ती पोस्ट पर “मैंने आवेदन किया” या “भर्ती फॉलो करें” दबाएँ — एडमिट कार्ड से रिजल्ट तक सब यहाँ दिखेगा।"
        action={<Button asChild className="font-hindi"><Link to="/jobs">नौकरियाँ देखें</Link></Button>}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {follows.data.map((f) => {
        const rows = (timeline.data ?? []).filter((r) => r.recruitment_id === f.recruitment_id);
        const examDate = rows.map((r) => r.exam_date).find(Boolean) ?? null;
        const admitPost = rows.find((r) => r.post?.post_type === "admit_card")?.post;
        const resultPost = rows.find((r) => r.post?.post_type === "result")?.post;
        const mainPost = rows.find((r) => r.post?.post_type === "job")?.post ?? rows[0]?.post;
        const done = {
          applied: f.applied,
          admit: Boolean(admitPost),
          exam: examDate ? (daysUntil(examDate) ?? 1) < 0 : false,
          result: Boolean(resultPost),
        };
        const nextAction = resultPost
          ? { label: "रिजल्ट देखें", to: `/blog/${resultPost.slug}` }
          : admitPost
            ? { label: "एडमिट कार्ड डाउनलोड करें", to: `/blog/${admitPost.slug}` }
            : mainPost
              ? { label: "भर्ती देखें", to: `/blog/${mainPost.slug}` }
              : null;
        return (
          <li key={f.recruitment_id} className="rounded-2xl border bg-card p-4">
            <p className="font-hindi text-lg font-semibold">{f.recruitment?.name ?? "भर्ती"}</p>
            <p className="font-hindi text-small text-muted-foreground">{f.recruitment?.organisation}</p>
            <ol className="mt-4 grid grid-cols-4 gap-1" aria-label="प्रगति">
              {STEPS.map((step) => {
                const complete = done[step.key];
                return (
                  <li key={step.key} className="flex flex-col items-center gap-1 text-center">
                    {complete ? <CheckCircle2 className="h-6 w-6 text-status-open" aria-hidden /> : <Circle className="h-6 w-6 text-muted-foreground" aria-hidden />}
                    <span className={cn("font-hindi text-caption", complete ? "text-foreground" : "font-normal text-muted-foreground")}>
                      {step.label}
                      {step.key === "exam" && examDate ? <span className="block tabular">{formatDate(examDate, { withYear: false })}</span> : null}
                    </span>
                    <span className="sr-only">{complete ? "पूरा" : "बाकी"}</span>
                  </li>
                );
              })}
            </ol>
            {nextAction && (
              <Button asChild variant="outline" className="mt-4 w-full font-hindi sm:w-auto">
                <Link to={nextAction.to}>{nextAction.label}</Link>
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function MyJobs() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("saved");
  const { ids, loading: idsLoading } = useSavedPosts();

  const saved = useQuery({
    queryKey: queryKeys.posts({ k: "saved", ids }),
    queryFn: () => listPosts({ ids: ids.slice(0, 50), limit: 50 }),
    enabled: !idsLoading,
  });
  const reminderIds = useQuery({ queryKey: queryKeys.reminders(user?.id ?? ""), queryFn: () => listReminderPostIds(user!.id), enabled: Boolean(user) });
  const reminders = useQuery({
    queryKey: queryKeys.posts({ k: "reminders", ids: reminderIds.data }),
    queryFn: () => listPosts({ ids: reminderIds.data ?? [], limit: 50 }),
    enabled: Boolean(reminderIds.data),
  });

  const savedItems = useMemo(() => sortOpenFirst(saved.data?.items ?? [], ids), [saved.data, ids]);

  const tabs: Array<{ key: Tab; label: string; count?: number }> = [
    { key: "saved", label: "सेव", count: ids.length },
    { key: "applied", label: "आवेदन / फॉलो" },
    { key: "reminders", label: "रिमाइंडर", count: reminderIds.data?.length },
  ];

  return (
    <div className="container-page py-6">
      <SEO title="मेरी नौकरियाँ | मालाणी बाड़मेर" description="सेव की गई नौकरियाँ, आवेदन ट्रैकर और रिमाइंडर।" path="/my" noindex />
      <h1 className="font-hindi text-2xl font-bold sm:text-3xl">मेरी नौकरियाँ</h1>

      <div role="tablist" aria-label="मेरी नौकरियाँ" className="mt-4 flex gap-1 overflow-x-auto rounded-xl border bg-card p-1 scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-lg px-4 py-2.5 font-hindi text-small font-semibold",
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {typeof t.count === "number" && t.count > 0 && <span className="ml-1 tabular">({t.count})</span>}
          </button>
        ))}
      </div>

      <div className="mt-6" role="tabpanel">
        {tab === "saved" && (
          <>
            {!user && ids.length > 0 && <GuestSyncPrompt />}
            {ids.length === 0 && !idsLoading ? (
              <EmptyState
                icon={Bookmark}
                title="अभी कोई सेव नहीं"
                description="किसी भी नौकरी पर 🔖 दबाकर उसे यहाँ सेव करें — लॉगिन की ज़रूरत नहीं।"
                action={<Button asChild className="font-hindi"><Link to="/jobs">नौकरियाँ देखें</Link></Button>}
              />
            ) : (
              <CardGrid posts={savedItems} loading={saved.isLoading || idsLoading} skeletons={3} />
            )}
          </>
        )}

        {tab === "applied" &&
          (user ? (
            <Tracker userId={user.id} />
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              title="आवेदन ट्रैकर के लिए साइन इन करें"
              description="आवेदन से एडमिट कार्ड, परीक्षा और रिजल्ट तक — हर कदम की सूचना पाएँ।"
              action={<Button asChild className="font-hindi"><Link to={loginUrl("/my")}>साइन इन करें</Link></Button>}
            />
          ))}

        {tab === "reminders" &&
          (user ? (
            reminderIds.data?.length === 0 ? (
              <EmptyState icon={BellRing} title="कोई रिमाइंडर नहीं" description="नौकरी पोस्ट पर “मुझे याद दिलाएँ” दबाएँ। अंतिम तिथि से 3 दिन और 1 दिन पहले सूचना मिलेगी।" />
            ) : (
              <CardGrid posts={reminders.data?.items} loading={reminders.isLoading || reminderIds.isLoading} skeletons={3} />
            )
          ) : (
            <EmptyState
              icon={BellRing}
              title="रिमाइंडर इसी फ़ोन पर हैं"
              description="बिना लॉगिन लगाए गए रिमाइंडर फ़ोन की नोटिफ़िकेशन से आते हैं। सभी डिवाइस पर देखने के लिए साइन इन करें।"
              action={<Button asChild variant="outline" className="font-hindi"><Link to={loginUrl("/my")}>साइन इन करें</Link></Button>}
            />
          ))}
      </div>
    </div>
  );
}
