import { useQuery } from "@tanstack/react-query";
import { CalendarCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import { EmptyState, SectionHeading } from "@/components/common/EmptyState";
import { CardRail, UpdateList } from "@/components/jobs/PostList";
import { AlertsCard } from "@/components/engagement/AlertsCard";
import { listPosts } from "@/services/posts";
import { queryKeys } from "@/lib/queryClient";
import { formatDate, istToday } from "@/lib/format";

/** "आज की अपडेट" — a fixed daily page readers can make a habit of (Blueprint Loop 4). */
export default function Today() {
  const today = istToday();
  const yesterday = istToday(new Date(Date.now() - 86_400_000));

  const todays = useQuery({
    queryKey: queryKeys.posts({ k: "today-page", today }),
    queryFn: () => listPosts({ since: `${today}T00:00:00+05:30`, limit: 50 }),
  });
  const yesterdays = useQuery({
    queryKey: queryKeys.posts({ k: "yesterday-page", yesterday }),
    queryFn: async () => {
      const page = await listPosts({ since: `${yesterday}T00:00:00+05:30`, limit: 50 });
      const startOfToday = new Date(`${today}T00:00:00+05:30`).getTime();
      return page.items.filter((p) => new Date(p.published_at).getTime() < startOfToday);
    },
  });
  const lastDays = useQuery({
    queryKey: queryKeys.posts({ k: "today-closing", today }),
    queryFn: () => listPosts({ postTypes: ["job"], jobStatus: "closing", sort: "deadline", limit: 8 }),
  });

  const items = todays.data?.items ?? [];

  return (
    <div className="container-page space-y-10 py-6">
      <SEO
        title={`आज की सरकारी नौकरी अपडेट (${formatDate(today)}) | मालाणी बाड़मेर`}
        description="आज जारी हुई नई भर्ती, एडमिट कार्ड, रिजल्ट और जिनकी अंतिम तिथि नज़दीक है — एक ही पेज पर।"
        path="/today"
        lang="hi"
      />
      <header>
        <p className="font-hindi text-small font-semibold text-primary">{formatDate(today, { long: true })}</p>
        <h1 className="font-hindi text-2xl font-bold sm:text-3xl">आज की अपडेट</h1>
        <p className="mt-1 font-hindi text-small text-muted-foreground">हर दिन सुबह से अब तक की सभी नई अपडेट।</p>
      </header>

      <section aria-labelledby="today-list">
        <SectionHeading id="today-list" title={`आज (${items.length})`} />
        {!todays.isLoading && items.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="आज अभी कोई नई अपडेट नहीं"
            description="नई भर्ती आते ही यहाँ दिखेगी। तब तक कल की अपडेट देखें।"
            action={<Button asChild variant="outline" className="font-hindi"><Link to="/jobs">सभी नौकरियाँ</Link></Button>}
          />
        ) : (
          <UpdateList posts={items} loading={todays.isLoading} />
        )}
      </section>

      {(lastDays.data?.items.length ?? 0) > 0 && (
        <section aria-labelledby="today-closing">
          <SectionHeading id="today-closing" title="⏰ अंतिम तिथि नज़दीक" />
          <CardRail posts={lastDays.data?.items} />
        </section>
      )}

      {(yesterdays.data?.length ?? 0) > 0 && (
        <section aria-labelledby="yesterday-list">
          <SectionHeading id="yesterday-list" title={`कल (${formatDate(yesterday, { withYear: false })})`} />
          <UpdateList posts={yesterdays.data} />
        </section>
      )}

      <AlertsCard />
    </div>
  );
}
