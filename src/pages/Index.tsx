import { lazy, Suspense, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Camera, ChevronRight, FileText, MapPin, Search, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import { SectionHeading } from "@/components/common/EmptyState";
import { CardGrid, CardRail, UpdateList } from "@/components/jobs/PostList";
import { FormHelpCard } from "@/components/engagement/FormHelpCard";
import { AlertsCard } from "@/components/engagement/AlertsCard";
import { NewsletterForm } from "@/components/engagement/NewsletterForm";
import { AdSlot } from "@/components/common/AdSlot";
import { usePreferences } from "@/hooks/usePreferences";
import { listPosts } from "@/services/posts";
import { queryKeys } from "@/lib/queryClient";
import { departmentLabel, qualificationLabel } from "@/lib/jobs";
import { formatDate, istToday } from "@/lib/format";
import { hasPreferences } from "@/lib/preferences";
import { buildLocalBusinessSchema, buildWebsiteSchema } from "@/lib/seo";
import { BUSINESS, isOpenAt } from "@/lib/business";
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

const SERVICES = [
  { to: "/services", title: "ई-मित्र सेवाएँ", text: "ऑनलाइन फॉर्म, प्रमाण पत्र, बिल भुगतान, आधार-पैन सहायता", icon: FileText },
  { to: "/mobile-electronics", title: "मोबाइल और इलेक्ट्रॉनिक्स", text: "नए मोबाइल, एक्सेसरीज़ और भरोसेमंद सलाह", icon: Smartphone },
  { to: "/mataji-studio", title: "माताजी स्टूडियो", text: "पासपोर्ट फोटो, शादी, प्री-वेडिंग और इवेंट फोटोग्राफी", icon: Camera },
];

export default function Index() {
  const navigate = useNavigate();
  const prefs = usePreferences();
  const [query, setQuery] = useState("");
  const [prefsOpen, setPrefsOpen] = useState(false);
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
      <section className="border-b bg-gradient-to-b from-secondary/70 to-background">
        <div className="container-page py-8 sm:py-12">
          <h1 className="max-w-2xl font-hindi text-[1.875rem] font-bold leading-tight sm:text-[2.75rem]">
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
                className="h-12 w-full rounded-xl border bg-card pl-12 pr-4 font-hindi text-body shadow-1 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" size="lg" className="font-hindi">खोजें</Button>
          </form>
          <nav aria-label="जल्दी खोजें" className="-mx-4 mt-4 overflow-x-auto px-4 scrollbar-none">
            <ul className="flex gap-2">
              {QUICK_CHIPS.map((chip) => (
                <li key={chip.to} className="shrink-0">
                  <Link to={chip.to} className="inline-flex h-10 items-center rounded-full border bg-card px-4 font-hindi text-small font-semibold text-foreground transition-colors hover:border-primary hover:text-primary">
                    {chip.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <div className="container-page space-y-12 py-8">
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
          <section className="flex flex-col items-start gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
              <Sparkles aria-hidden className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <h2 className="font-hindi text-lg font-bold">3 सवाल, फिर सिर्फ़ आपकी नौकरियाँ</h2>
              <p className="font-hindi text-small text-muted-foreground">अपनी योग्यता और पसंद बताएँ — बिना लॉगिन।</p>
            </div>
            <Button type="button" onClick={() => setPrefsOpen(true)} className="font-hindi">शुरू करें</Button>
          </section>
        )}

        {/* Closing soon */}
        {(closing.isLoading || (closing.data?.items.length ?? 0) > 0) && (
          <section aria-labelledby="closing-soon">
            <SectionHeading
              id="closing-soon"
              title="⏰ अंतिम तिथि नज़दीक"
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
          <UpdateList posts={todays.data?.items} loading={todays.isLoading} />
        </section>

        {!personalised && (
          <section aria-labelledby="latest-jobs">
            <SectionHeading
              id="latest-jobs"
              title="नई भर्तियाँ"
              action={<Link to="/jobs" className="inline-flex items-center gap-1 font-hindi text-small font-semibold text-primary">सभी नौकरियाँ <ChevronRight className="h-4 w-4" /></Link>}
            />
            <CardGrid posts={latestJobs.data?.items} loading={latestJobs.isLoading} />
          </section>
        )}

        <FormHelpCard />

        <div className="grid gap-4 lg:grid-cols-2">
          <AlertsCard />
          <NewsletterForm />
        </div>

        {/* Trust strip */}
        <section aria-label="भरोसा" className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: BadgeCheck, title: "अधिकृत ई-मित्र केंद्र", text: `${BUSINESS.address.cityHi} में स्थानीय दुकान` },
            { icon: ShieldCheck, title: "आधिकारिक स्रोत से", text: "हर भर्ती के साथ अधिसूचना और आधिकारिक लिंक" },
            { icon: MapPin, title: open ? "दुकान अभी खुली है" : "दुकान अभी बंद है", text: BUSINESS.hoursTextHi },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3 rounded-2xl border bg-card p-4">
              <Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-hindi font-semibold">{title}</p>
                <p className="font-hindi text-small text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </section>

        <AdSlot />

        {/* Services */}
        <section aria-labelledby="our-services">
          <SectionHeading id="our-services" title="हमारी सेवाएँ" />
          <div className="grid gap-3 sm:grid-cols-3">
            {SERVICES.map(({ to, title, text, icon: Icon }) => (
              <Link key={to} to={to} className="group flex flex-col gap-3 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-1">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                  <Icon aria-hidden className="h-5 w-5" />
                </span>
                <span className="font-hindi text-lg font-bold">{title}</span>
                <span className="font-hindi text-small text-muted-foreground">{text}</span>
                <span className="mt-auto inline-flex items-center gap-1 font-hindi text-small font-semibold text-primary">
                  देखें <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
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
