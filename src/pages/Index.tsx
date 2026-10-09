import { lazy, Suspense, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Brain, ChevronRight, Clock, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import { SectionHeading } from "@/components/common/EmptyState";
import { CardGrid, CardRail, UpdateList } from "@/components/jobs/PostList";
import { ShopStrip } from "@/components/home/ShopStrip";
import { StayUpdatedCard } from "@/components/engagement/StayUpdatedCard";
import { AdSlot } from "@/components/common/AdSlot";
import { usePreferences } from "@/hooks/usePreferences";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { listPosts } from "@/services/posts";
import { queryKeys } from "@/lib/queryClient";
import { departmentLabel, qualificationLabel } from "@/lib/jobs";
import { formatDate, istToday } from "@/lib/format";
import { hasPreferences } from "@/lib/preferences";
import { buildLocalBusinessSchema, buildWebsiteSchema } from "@/lib/seo";
import { BUSINESS, isOpenAt } from "@/lib/business";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

const PreferenceSheet = lazy(() => import("@/components/engagement/PreferenceSheet"));

const QUICK_CHIPS = [
  { label: "10वीं पास", to: "/jobs?qualification=10th" },
  { label: "12वीं पास", to: "/jobs?qualification=12th" },
  { label: "ग्रेजुएट", to: "/jobs?qualification=graduate" },
  { label: "पुलिस", to: "/jobs?department=police" },
  { label: "रेलवे", to: "/jobs?department=railway" },
  { label: "बैंक", to: "/jobs?department=bank" },
  { label: "शिक्षक", to: "/jobs?department=teacher" },
  { label: "पटवारी", to: "/jobs?department=patwari" },
];


const UPDATE_TABS = [
  { value: "all", label: "सभी" },
  { value: "jobs", label: "भर्ती / परीक्षा" },
  { value: "articles", label: "लेख" },
] as const;
type UpdateTab = (typeof UPDATE_TABS)[number]["value"];
const NOTICE_TYPES = new Set(["job", "admit_card", "result", "exam"]);

const TRUST = [
  { icon: BadgeCheck, title: "अधिकृत ई-मित्र केंद्र", text: `${BUSINESS.address.cityHi} में अपनी दुकान — रेलवे स्टेशन के सामने`, status: false },
  { icon: ShieldCheck, title: "आधिकारिक स्रोत से", text: "हर भर्ती के साथ अधिसूचना और आधिकारिक लिंक", status: false },
  { icon: Clock, title: "दुकान का समय", text: BUSINESS.hoursTextHi, status: true },
];

export default function Index() {
  const navigate = useNavigate();
  const prefs = usePreferences();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [query, setQuery] = useState("");
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [updateTab, setUpdateTab] = useState<UpdateTab>("all");
  const personalised = hasPreferences(prefs);
  const today = istToday();
  const open = isOpenAt(new Date());

  const forYou = useQuery({
    queryKey: queryKeys.posts({ k: "for-you", q: prefs.qualification, d: prefs.departments }),
    queryFn: async () => {
      const byQual = await listPosts({ postTypes: ["job"], qualification: prefs.qualification ?? undefined, jobStatus: "active", sort: "latest", limit: 12 });
      if (!prefs.departments.length) return byQual.items.slice(0, 6);
      const preferred = byQual.items.filter((p) => p.departments?.some((d) => prefs.departments.includes(d)));
      const rest = byQual.items.filter((p) => !preferred.includes(p));
      return [...preferred, ...rest].slice(0, 6);
    },
    enabled: personalised,
  });

  const closing = useQuery({
    queryKey: queryKeys.posts({ k: "closing" }),
    queryFn: () => listPosts({ postTypes: ["job"], jobStatus: "closing", sort: "deadline", limit: 8 }),
  });

  const todays = useQuery({
    queryKey: queryKeys.posts({ k: "today", today }),
    queryFn: async () => {
      const page = await listPosts({ since: `${today}T00:00:00+05:30`, limit: 8 });
      return page.items.length ? { title: "आज की अपडेट", items: page.items } : { title: "ताज़ा अपडेट", items: (await listPosts({ limit: 8 })).items };
    },
  });

  const latestJobs = useQuery({
    queryKey: queryKeys.posts({ k: "latest-jobs" }),
    queryFn: () => listPosts({ postTypes: ["job"], jobStatus: "active", limit: 6 }),
    enabled: !personalised,
  });

  const updates = todays.data?.items;
  const noticeUpdates = updates?.filter((p) => NOTICE_TYPES.has(p.post_type ?? "article")) ?? [];
  const showUpdateTabs = Boolean(updates && noticeUpdates.length > 0 && noticeUpdates.length < updates.length);
  const visibleUpdates =
    !showUpdateTabs || updateTab === "all" ? updates : updateTab === "jobs" ? noticeUpdates : updates?.filter((p) => !NOTICE_TYPES.has(p.post_type ?? "article"));

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    track("search", { from: "home", term: q });
    navigate(q ? `/jobs?q=${encodeURIComponent(q)}` : "/jobs");
  }

  return (
    <>
      <SEO
        title="सरकारी नौकरी, एडमिट कार्ड, रिजल्ट — बाड़मेर | मालाणी"
        description="राजस्थान और केंद्र की नई सरकारी भर्तियाँ, अंतिम तिथि, एडमिट कार्ड और रिजल्ट — सरल हिंदी में। फॉर्म भरवाने के लिए मालाणी ई-मित्र, बाड़मेर।"
        path="/"
        lang="hi"
        jsonLd={[buildWebsiteSchema(), buildLocalBusinessSchema()]}
      />

      {/* Hero: search first (Blueprint §9.1) */}
      <section className="border-b bg-card">
        <div className="container-page grid items-center gap-8 py-6 sm:py-10 lg:grid-cols-[1.35fr_1fr]">
          <div className="min-w-0">
          <h1 className="max-w-2xl font-hindi text-[1.75rem] font-bold leading-tight sm:text-[2.5rem]">
            आपकी अगली सरकारी नौकरी यहाँ है
          </h1>
          <p className="mt-2 max-w-xl font-hindi text-body text-muted-foreground">
            राजस्थान और पूरे भारत की भर्तियाँ, एडमिट कार्ड और रिजल्ट — आधिकारिक स्रोत से, सरल हिंदी में।
          </p>
          <form onSubmit={onSearch} role="search" className="mt-5 flex max-w-2xl gap-2">
            <label htmlFor="home-search" className="sr-only">भर्ती, विभाग या पद खोजें</label>
            <div className="relative flex-1">
              <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="home-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="भर्ती, विभाग या पद खोजें…"
                enterKeyHint="search"
                className="h-12 w-full rounded-xl border border-input bg-background pl-12 pr-4 font-hindi text-body placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" size="lg" className="font-hindi">खोजें</Button>
          </form>
          <nav aria-label="जल्दी खोजें" className="rail-fade -mx-4 mt-4 overflow-x-auto px-4 scrollbar-none sm:[mask-image:none]">
            <ul className="flex gap-2">
              {QUICK_CHIPS.map((chip) => (
                <li key={chip.to} className="shrink-0">
                  <Link to={chip.to} className="inline-flex h-11 items-center rounded-full border bg-background px-4 font-hindi text-small font-semibold text-foreground transition-colors hover:border-primary">
                    {chip.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          </div>
          {/* Desktop: the real shop front builds trust next to the search (not rendered on phones, so not downloaded). */}
          {desktop && (
          <figure>
            <img
              src="/shop/storefront-800.webp"
              srcSet="/shop/storefront-480.webp 480w, /shop/storefront-800.webp 800w"
              sizes="40vw"
              alt="मालाणी मोबाइल, ई-मित्र सर्विस और माताजी स्टूडियो की दुकान, बाड़मेर"
              width={800}
              height={500}
              {...{ fetchpriority: "high" }}
              className="aspect-[16/10] w-full rounded-xl border object-cover shadow-2"
            />
            <figcaption className="mt-2 flex items-center gap-2 font-hindi text-small text-muted-foreground">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" /> हमारी दुकान — रेलवे स्टेशन के सामने, बाड़मेर
            </figcaption>
          </figure>
          )}
        </div>
      </section>

      <div className="container-page space-y-10 py-6 sm:space-y-12 sm:py-8">
        <ShopStrip />

        {/* For you */}
        {personalised ? (
          <section aria-labelledby="for-you">
            <SectionHeading
              id="for-you"
              title="आपके लिए"
              description={[qualificationLabel(prefs.qualification), ...prefs.departments.map(departmentLabel)].filter(Boolean).slice(0, 4).join(" · ")}
              action={
                <button type="button" onClick={() => setPrefsOpen(true)} className="font-hindi text-small font-semibold text-primary">
                  बदलें
                </button>
              }
            />
            <CardGrid posts={forYou.data} loading={forYou.isLoading} />
            {forYou.data && forYou.data.length === 0 && (
              <p className="rounded-2xl border bg-card p-6 text-center font-hindi text-small text-muted-foreground">
                अभी आपकी पसंद से मेल खाती कोई खुली भर्ती नहीं है। नई भर्ती आते ही यहाँ दिखेगी।
              </p>
            )}
          </section>
        ) : (
          <section className="flex items-center gap-4 rounded-xl bg-primary p-4 text-primary-foreground sm:p-5">
            <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 sm:grid">
              <Sparkles aria-hidden className="h-6 w-6 text-accent" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-hindi text-lg font-bold text-primary-foreground">3 सवाल, फिर सिर्फ़ आपकी नौकरियाँ</h2>
              <p className="font-hindi text-small text-primary-foreground/80">योग्यता और पसंद चुनें — बिना लॉगिन।</p>
            </div>
            <Button type="button" variant="accent" onClick={() => setPrefsOpen(true)} className="shrink-0 font-hindi">शुरू करें</Button>
          </section>
        )}

        {/* Closing soon */}
        {(closing.isLoading || (closing.data?.items.length ?? 0) > 0) && (
          <section aria-labelledby="closing-soon">
            <SectionHeading
              id="closing-soon"
              title="अंतिम तिथि नज़दीक"
              action={<Link to="/jobs?status=closing" className="inline-flex items-center gap-1 font-hindi text-small font-semibold text-primary">सभी <ChevronRight className="h-4 w-4" /></Link>}
            />
            <CardRail posts={closing.data?.items} loading={closing.isLoading} />
          </section>
        )}

        {/* Today's updates */}
        <section aria-labelledby="today-updates">
          <SectionHeading
            id="today-updates"
            title={`${todays.data?.title ?? "आज की अपडेट"} (${formatDate(today, { withYear: false })})`}
            action={<Link to="/today" className="inline-flex items-center gap-1 font-hindi text-small font-semibold text-primary">सभी <ChevronRight className="h-4 w-4" /></Link>}
          />
          {showUpdateTabs && (
            <div role="group" aria-label="अपडेट का प्रकार" className="mb-3 flex gap-2">
              {UPDATE_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={updateTab === t.value}
                  onClick={() => setUpdateTab(t.value)}
                  className={cn(
                    "h-9 rounded-full border px-3.5 font-hindi text-small font-semibold transition-colors",
                    updateTab === t.value ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:border-primary",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <UpdateList posts={visibleUpdates} loading={todays.isLoading} />
          <Link
            to="/quiz"
            className="group mt-3 flex min-h-14 items-center gap-3 rounded-xl border bg-card px-4 py-2.5 shadow-1 transition-shadow hover:shadow-2"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-foreground ring-1 ring-accent/40">
              <Brain aria-hidden className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 font-hindi">
              <strong className="font-semibold">आज का GK क्विज़</strong>
              <span className="text-small text-muted-foreground"> — 2 मिनट की तैयारी</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 font-hindi text-small font-semibold text-link">
              खेलें <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </section>

        {!personalised && (latestJobs.isLoading || (latestJobs.data?.items.length ?? 0) >= 3) && (
          <section aria-labelledby="latest-jobs">
            <SectionHeading
              id="latest-jobs"
              title="नई भर्तियाँ"
              action={<Link to="/jobs" className="inline-flex items-center gap-1 font-hindi text-small font-semibold text-primary">सभी नौकरियाँ <ChevronRight className="h-4 w-4" /></Link>}
            />
            <CardGrid posts={latestJobs.data?.items} loading={latestJobs.isLoading} />
          </section>
        )}

        <AdSlot />

        <StayUpdatedCard />

        {/* Trust strip */}
        <section aria-label="भरोसा" className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">
          {TRUST.map(({ icon: Icon, title, text, status }) => (
            <div key={title} className="flex items-start gap-3 bg-card p-4">
              <Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-link" />
              <div>
                <p className="flex flex-wrap items-center gap-2 font-hindi font-semibold">
                  {title}
                  {status && (
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption", open ? "bg-status-open-bg text-status-open" : "bg-status-closed-bg text-status-closed")}>
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                      {open ? "अभी खुली है" : "अभी बंद है"}
                    </span>
                  )}
                </p>
                <p className="font-hindi text-small text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      {prefsOpen && (
        <Suspense fallback={null}>
          <PreferenceSheet open={prefsOpen} onOpenChange={setPrefsOpen} />
        </Suspense>
      )}
    </>
  );
}
