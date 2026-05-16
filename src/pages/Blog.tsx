import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, TrendingUp } from "lucide-react";
import { getPostsWithStats, type PostWithStats } from "@/services/posts";
import { BlogShell } from "@/components/blog/BlogShell";
import { FeaturedArticle } from "@/components/blog/FeaturedArticle";
import { BlogCard } from "@/components/blog/BlogCard";
import { SectionHeader } from "@/components/blog/SectionHeader";
import { EmptyState } from "@/components/blog/EmptyState";
import { BlogCardGridSkeleton } from "@/components/blog/BlogCardGridSkeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { hi } from "@/lib/blogHindi";
import { brandCtaClass } from "@/lib/blogBrand";
import { HindiTypography } from "@/components/blog/HindiTypography";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/seo/SEO";

const CATEGORIES: { id: string; label: string; match: (p: PostWithStats) => boolean }[] = [
  { id: "all", label: hi.filterAll, match: () => true },
  {
    id: "insights",
    label: hi.filterInsights,
    match: (p) =>
      /(टिप|गाइड|कैसे|जानकारी|guide|how|tip|insight|सेवा|समाधान)/i.test(`${p.title} ${p.excerpt}`),
  },
  {
    id: "updates",
    label: hi.filterUpdates,
    match: (p) => /(अपडेट|समाचार|घोषणा|news|update|launch|नया)/i.test(`${p.title} ${p.excerpt}`),
  },
  {
    id: "community",
    label: hi.filterCommunity,
    match: (p) => p.comments_count >= 2,
  },
];

const Blog = () => {
  const [posts, setPosts] = useState<PostWithStats[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [feedTab, setFeedTab] = useState<"latest" | "trending">("latest");

  useEffect(() => {
    getPostsWithStats()
      .then(setPosts)
      .catch((e: Error) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    if (!posts) return [];
    const cat = CATEGORIES.find((c) => c.id === category)?.match ?? (() => true);
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (!cat(p)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
      );
    });
  }, [posts, search, category]);

  const hasActiveFilters = Boolean(search.trim()) || category !== "all";

  const featured = useMemo(() => {
    if (!posts?.length || hasActiveFilters) return null;
    return posts[0];
  }, [posts, hasActiveFilters]);

  const trending = useMemo(() => {
    if (!filtered.length) return [];
    return [...filtered].sort((a, b) => b.likes_count - a.likes_count).slice(0, 4);
  }, [filtered]);

  const gridPosts = useMemo(() => {
    const base = feedTab === "trending" ? [...filtered].sort((a, b) => b.likes_count - a.likes_count) : filtered;
    if (featured && !hasActiveFilters && feedTab === "latest") {
      return base.filter((p) => p.id !== featured.id);
    }
    return base;
  }, [filtered, featured, hasActiveFilters, feedTab]);

  return (
    <BlogShell>
      <SEO
        title="Blog — Malani Barmer | E-Mitra, Mobile & Photography Updates"
        description="Latest updates, guides and news from Malani Barmer on E-Mitra government services, mobile electronics, and Mataji photography studio in Barmer, Rajasthan."
        path="/blog"
        keywords={["Malani Barmer blog", "E-Mitra Barmer", "government jobs Rajasthan", "mobile electronics Barmer"]}
      />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{hi.blogEyebrow}</p>
          <HindiTypography as="h1" className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {hi.blogTitle}
          </HindiTypography>
          <HindiTypography as="p" className="mt-4 text-lg text-gray-600 sm:text-xl">
            {hi.blogSubtitle}
          </HindiTypography>
        </div>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600/70" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={hi.searchPlaceholder}
              className="h-12 rounded-full border-amber-200/80 bg-white/90 pl-10 font-hindi shadow-inner backdrop-blur-sm focus-visible:ring-amber-400/40"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={category === c.id ? "default" : "secondary"}
                className={cn(
                  "h-10 rounded-full px-4 font-hindi text-xs font-semibold shadow-sm",
                  category === c.id && brandCtaClass,
                )}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-10 inline-flex rounded-full border border-amber-100/90 bg-white/70 p-1 shadow-md backdrop-blur-md">
          <Button
            type="button"
            variant={feedTab === "latest" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "rounded-full px-5 font-hindi",
              feedTab === "latest" && brandCtaClass,
            )}
            onClick={() => setFeedTab("latest")}
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            {hi.tabLatest}
          </Button>
          <Button
            type="button"
            variant={feedTab === "trending" ? "default" : "ghost"}
            size="sm"
            className={cn("rounded-full px-5 font-hindi", feedTab === "trending" && brandCtaClass)}
            onClick={() => setFeedTab("trending")}
          >
            <TrendingUp className="mr-1.5 h-4 w-4" />
            {hi.tabTrending}
          </Button>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-hindi text-sm text-red-800">{error}</div>
        )}

        {!posts && <BlogCardGridSkeleton count={6} />}

        {posts && posts.length === 0 && (
          <EmptyState icon={Sparkles} title={hi.emptyNoPosts} description={hi.emptyNoPostsDesc} />
        )}

        {posts && posts.length > 0 && filtered.length === 0 && (
          <EmptyState
            icon={Search}
            title={hi.emptyNoMatch}
            description={hi.emptyNoMatchDesc}
            action={
              <Button variant="outline" className="rounded-full font-hindi" onClick={() => { setSearch(""); setCategory("all"); }}>
                {hi.resetFilters}
              </Button>
            }
          />
        )}

        {featured && <FeaturedArticle post={featured} />}

        {posts && filtered.length > 0 && trending.length > 0 && (
          <section className="mb-14">
            <SectionHeader eyebrow={hi.tabTrending} title={hi.trendingTitle} description={hi.trendingDesc} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((p, i) => (
                <BlogCard key={p.id} post={p} index={i} />
              ))}
            </div>
          </section>
        )}

        {posts && gridPosts.length > 0 && (
          <section>
            <SectionHeader
              eyebrow={hi.libraryEyebrow}
              title={feedTab === "trending" ? hi.libraryTrending : hi.libraryLatest}
              description={feedTab === "trending" ? hi.libraryTrendingDesc : hi.libraryLatestDesc}
            />
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {gridPosts.map((p, i) => (
                <BlogCard key={p.id} post={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </motion.div>
    </BlogShell>
  );
};

export default Blog;
