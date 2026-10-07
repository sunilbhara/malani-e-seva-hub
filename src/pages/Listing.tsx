import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { SearchX, SlidersHorizontal, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import { EmptyState } from "@/components/common/EmptyState";
import { JobCard, JobCardSkeleton } from "@/components/jobs/JobCard";
import { AlertsCard } from "@/components/engagement/AlertsCard";
import { EMPTY_FILTERS, FilterSheet, type ListingFilters } from "@/components/jobs/FilterSheet";
import { listPosts } from "@/services/posts";
import { departmentLabel, qualificationLabel, stateLabel } from "@/lib/jobs";
import { buildBreadcrumbSchema } from "@/lib/seo";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export type ListingKind = "jobs" | "admit" | "result" | "all";

const KINDS: Record<ListingKind, { path: string; title: string; heading: string; description: string; postTypes?: string[]; jobFilters: boolean }> = {
  jobs: {
    path: "/jobs",
    title: "सरकारी नौकरी 2026 — नई भर्ती, अंतिम तिथि | मालाणी बाड़मेर",
    heading: "सरकारी नौकरियाँ",
    description: "राजस्थान और केंद्र सरकार की नई भर्तियाँ — योग्यता, विभाग और अंतिम तिथि के अनुसार।",
    postTypes: ["job"],
    jobFilters: true,
  },
  admit: {
    path: "/admit-card",
    title: "एडमिट कार्ड 2026 — डाउनलोड लिंक | मालाणी बाड़मेर",
    heading: "एडमिट कार्ड",
    description: "सभी परीक्षाओं के एडमिट कार्ड, नवीनतम पहले, सीधे डाउनलोड लिंक के साथ।",
    postTypes: ["admit_card"],
    jobFilters: false,
  },
  result: {
    path: "/result",
    title: "रिजल्ट, आंसर की और कट-ऑफ 2026 | मालाणी बाड़मेर",
    heading: "रिजल्ट और परीक्षा",
    description: "रिजल्ट, आंसर की, कट-ऑफ और परीक्षा तिथियाँ — सबसे पहले।",
    postTypes: ["result", "exam"],
    jobFilters: false,
  },
  all: {
    path: "/blog",
    title: "सभी अपडेट — नौकरी, परीक्षा, बाड़मेर | मालाणी बाड़मेर",
    heading: "सभी अपडेट",
    description: "नौकरी, एडमिट कार्ड, रिजल्ट, बाड़मेर की स्थानीय खबरें और ई-मित्र गाइड।",
    jobFilters: false,
  },
};

const QUICK = [
  { label: "सभी", patch: { status: "", state: "" } },
  { label: "आवेदन जारी", patch: { status: "active" } },
  { label: "अंतिम तिथि नज़दीक", patch: { status: "closing" } },
  { label: "राजस्थान", patch: { state: "rajasthan" } },
  { label: "केंद्र सरकार", patch: { state: "all_india" } },
];

const PAGE_SIZE = 20;

function readFilters(params: URLSearchParams): ListingFilters {
  return {
    q: params.get("q") ?? "",
    qualification: params.get("qualification") ?? "",
    department: params.get("department") ?? "",
    state: params.get("state") ?? "",
    status: params.get("status") ?? "",
    sort: params.get("sort") ?? "latest",
  };
}

export default function Listing({ kind }: { kind: ListingKind }) {
  const meta = KINDS[kind];
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  const [search, setSearch] = useState(filters.q);
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => setSearch(filters.q), [filters.q]);
  useEffect(() => {
    if (params.get("focus") === "search") searchRef.current?.focus();
  }, [params]);

  const query = useInfiniteQuery({
    queryKey: ["listing", kind, filters],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listPosts({
        postTypes: meta.postTypes,
        search: filters.q,
        qualification: filters.qualification,
        department: filters.department,
        state: filters.state,
        jobStatus: (filters.status || undefined) as never,
        sort: (filters.sort || "latest") as never,
        limit: PAGE_SIZE,
        offset: pageParam,
      }),
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, p) => n + p.items.length, 0);
      return loaded < last.total ? loaded : undefined;
    },
  });

  // Load the next page when the sentinel scrolls into view (falls back to the button).
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !query.hasNextPage || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !query.isFetchingNextPage) void query.fetchNextPage();
    }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query]);

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  function update(patch: Partial<ListingFilters>) {
    const next = { ...filters, ...patch };
    const sp = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v && !(k === "sort" && v === "latest")) sp.set(k, v);
    });
    setParams(sp, { replace: true });
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    track("search", { from: kind, term: search.trim() });
    update({ q: search.trim() });
  }

  const activeChips = [
    filters.qualification && { key: "qualification", label: qualificationLabel(filters.qualification) },
    filters.department && { key: "department", label: departmentLabel(filters.department) },
    filters.state && { key: "state", label: stateLabel(filters.state) },
  ].filter(Boolean) as Array<{ key: keyof ListingFilters; label: string }>;
  const activeCount = activeChips.length + (filters.status ? 1 : 0) + (filters.sort !== "latest" ? 1 : 0);

  const pairTabs = kind === "admit" || kind === "result";

  return (
    <div className="container-page py-6">
      <SEO
        title={meta.title}
        description={meta.description}
        path={meta.path}
        lang="hi"
        noindex={Boolean(filters.q)}
        jsonLd={buildBreadcrumbSchema([{ name: "होम", path: "/" }, { name: meta.heading, path: meta.path }])}
      />

      {pairTabs && (
        <div role="tablist" aria-label="रिजल्ट या एडमिट कार्ड" className="mb-4 inline-flex rounded-xl border bg-card p-1">
          {[
            { to: "/result", label: "रिजल्ट / परीक्षा", active: kind === "result" },
            { to: "/admit-card", label: "एडमिट कार्ड", active: kind === "admit" },
          ].map((t) => (
            <Link
              key={t.to}
              to={t.to}
              role="tab"
              aria-selected={t.active}
              className={cn("rounded-lg px-4 py-2 font-hindi text-small font-semibold", t.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {t.label}
            </Link>
          ))}
        </div>
      )}

      <h1 className="font-hindi text-2xl font-bold sm:text-3xl">{meta.heading}</h1>
      <p className="mt-1 font-hindi text-small text-muted-foreground">{meta.description}</p>

      {/* Sticky search + filter */}
      <div className="sticky top-14 z-30 -mx-4 mt-4 border-b bg-background/95 px-4 py-3 backdrop-blur lg:top-16">
        <div className="flex gap-2">
          <form onSubmit={onSearch} role="search" className="relative flex-1">
            <label htmlFor="listing-search" className="sr-only">खोजें</label>
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              id="listing-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="भर्ती, विभाग या पद खोजें…"
              enterKeyHint="search"
              className="h-11 w-full rounded-xl border bg-card pl-11 pr-3 font-hindi text-body placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
          <Button type="button" variant="outline" onClick={() => setSheetOpen(true)} className="font-hindi" aria-label={`फ़िल्टर${activeCount ? `, ${activeCount} चुने गए` : ""}`}>
            <SlidersHorizontal />
            <span className="hidden sm:inline">फ़िल्टर</span>
            {activeCount > 0 && <span className="rounded-full bg-primary px-1.5 text-caption text-primary-foreground tabular">{activeCount}</span>}
          </Button>
        </div>

        {meta.jobFilters && (
          <div className="-mx-4 mt-3 overflow-x-auto px-4 scrollbar-none">
            <div className="flex gap-2">
              {QUICK.map((chip) => {
                const active =
                  chip.label === "सभी"
                    ? !filters.status && !filters.state
                    : Object.entries(chip.patch).every(([k, v]) => filters[k as keyof ListingFilters] === v);
                return (
                  <button
                    key={chip.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      track("filter_apply", { chip: chip.label });
                      update(active && chip.label !== "सभी" ? Object.fromEntries(Object.keys(chip.patch).map((k) => [k, ""])) : chip.patch);
                    }}
                    className={cn(
                      "h-9 shrink-0 rounded-full border px-3.5 font-hindi text-small font-semibold transition-colors",
                      active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted",
                    )}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <p className="mr-auto font-hindi text-small text-muted-foreground tabular" aria-live="polite">
          {query.isLoading ? "खोज रहे हैं…" : `${total} ${kind === "jobs" ? "भर्तियाँ" : "अपडेट"}`}
          {filters.q && ` — “${filters.q}”`}
        </p>
        {activeChips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => update({ [chip.key]: "" })}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-secondary px-3 font-hindi text-caption text-secondary-foreground"
            aria-label={`${chip.label} हटाएँ`}
          >
            {chip.label} <X className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {query.isLoading && Array.from({ length: 6 }, (_, i) => <JobCardSkeleton key={i} />)}
        {items.map((post, index) => (
          <FragmentWithAlert key={post.id} index={index}>
            <JobCard post={post} />
          </FragmentWithAlert>
        ))}
      </div>

      {query.isError && (
        <EmptyState
          icon={SearchX}
          title="अपडेट लोड नहीं हो सकीं"
          description="इंटरनेट कनेक्शन जाँचें और दोबारा कोशिश करें।"
          action={<Button onClick={() => void query.refetch()} className="font-hindi">दोबारा कोशिश करें</Button>}
          className="mt-4"
        />
      )}

      {!query.isLoading && !query.isError && items.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="कोई नतीजा नहीं मिला"
          description="फ़िल्टर कम करें या कोई दूसरा शब्द खोजें।"
          action={<Button variant="outline" onClick={() => setParams(new URLSearchParams(), { replace: true })} className="font-hindi">फ़िल्टर हटाएँ</Button>}
          className="mt-4"
        />
      )}

      <div ref={sentinel} />
      {query.hasNextPage && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage} className="font-hindi">
            {query.isFetchingNextPage ? "लोड हो रहा है…" : "और देखें"}
          </Button>
        </div>
      )}

      <FilterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        value={filters}
        postTypes={meta.postTypes}
        jobFilters={meta.jobFilters}
        onApply={(next) => {
          track("filter_apply", { from: "sheet" });
          update(next);
          setSheetOpen(false);
        }}
      />
    </div>
  );
}

/** Inserts the alerts prompt after the 6th card (Blueprint §9.3). */
function FragmentWithAlert({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <>
      {children}
      {index === 5 && <AlertsCard compact className="sm:col-span-2 lg:col-span-3" />}
    </>
  );
}

