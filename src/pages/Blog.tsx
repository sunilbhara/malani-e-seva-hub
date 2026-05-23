import { useEffect, useMemo, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, Search, Sparkles, TrendingUp } from "lucide-react";
import { getPostsWithStats, type PostWithStats } from "@/services/posts";
import { getUserNotifications, subscribeNewsletter } from "@/services/blogExtras";
import { useAuth } from "@/hooks/useAuth";
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

type UserNotification = {
  id: string;
  post_id: string | null;
  title: string;
  body?: string | null;
  read_at?: string | null;
  created_at: string;
};

const Blog = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithStats[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tag, setTag] = useState("All");
  const [postType, setPostType] = useState("All");
  const [feedTab, setFeedTab] = useState<"latest" | "trending">("latest");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    getPostsWithStats()
      .then(setPosts)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!user) return;
    getUserNotifications(user.id).then(setNotifications).catch(() => setNotifications([]));
  }, [user]);

  const categories = useMemo(() => {
    if (!posts) return ["All"];
    return ["All", ...Array.from(new Set(posts.map((post) => post.category || "General"))).sort()];
  }, [posts]);

  const tags = useMemo(() => {
    if (!posts) return ["All"];
    return ["All", ...Array.from(new Set(posts.flatMap((post) => post.tags ?? []))).sort()];
  }, [posts]);

  const postTypes = useMemo(() => {
    if (!posts) return ["All"];
    return ["All", ...Array.from(new Set(posts.map((post) => post.post_type || "article"))).sort()];
  }, [posts]);

  const filtered = useMemo(() => {
    if (!posts) return [];
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (category !== "All" && (p.category || "General") !== category) return false;
      if (tag !== "All" && !(p.tags ?? []).includes(tag)) return false;
      if (postType !== "All" && (p.post_type || "article") !== postType) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        (p.tags ?? []).join(" ").toLowerCase().includes(q)
      );
    });
  }, [posts, search, category, tag, postType]);

  const hasActiveFilters = Boolean(search.trim()) || category !== "All" || tag !== "All" || postType !== "All";

  const featured = useMemo(() => {
    if (!posts?.length || hasActiveFilters) return null;
    return posts[0];
  }, [posts, hasActiveFilters]);

  const trending = useMemo(() => {
    if (!filtered.length) return [];
    return [...filtered]
      .sort((a, b) => b.views_count + b.likes_count * 3 + b.comments_count * 2 - (a.views_count + a.likes_count * 3 + a.comments_count * 2))
      .slice(0, 4);
  }, [filtered]);

  const gridPosts = useMemo(() => {
    const base = feedTab === "trending" ? [...filtered].sort((a, b) => b.likes_count - a.likes_count) : filtered;
    if (featured && !hasActiveFilters && feedTab === "latest") {
      return base.filter((p) => p.id !== featured.id);
    }
    return base;
  }, [filtered, featured, hasActiveFilters, feedTab]);

  const visiblePosts = gridPosts.slice(0, visibleCount);

  async function onNewsletterSubmit(e: FormEvent) {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    try {
      await subscribeNewsletter(newsletterEmail, category === "All" ? [] : [category]);
      setNewsletterEmail("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Newsletter subscription failed");
    }
  }

  function resetFilters() {
    setSearch("");
    setCategory("All");
    setTag("All");
    setPostType("All");
    setVisibleCount(9);
  }

  return (
    <BlogShell>
      <SEO
        title="Blog - Malani Barmer | E-Mitra, Mobile & Photography Updates"
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

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600/70" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(9);
              }}
              placeholder={hi.searchPlaceholder}
              className="h-12 rounded-full border-amber-200/80 bg-white/90 pl-10 font-hindi shadow-inner backdrop-blur-sm focus-visible:ring-amber-400/40"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Button
                key={c}
                type="button"
                size="sm"
                variant={category === c ? "default" : "secondary"}
                className={cn("h-10 rounded-full px-4 font-hindi text-xs font-semibold shadow-sm", category === c && brandCtaClass)}
                onClick={() => {
                  setCategory(c);
                  setVisibleCount(9);
                }}
              >
                {c === "All" ? hi.filterAll : c}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-8 grid gap-3 rounded-2xl border border-amber-100 bg-white/80 p-4 shadow-sm lg:grid-cols-[1fr_1fr_1.2fr]">
          <select value={tag} onChange={(e) => { setTag(e.target.value); setVisibleCount(9); }} className="h-11 rounded-xl border border-amber-200 bg-white px-3 font-hindi text-sm">
            {tags.map((item) => <option key={item} value={item}>{item === "All" ? "All Tags" : item}</option>)}
          </select>
          <select value={postType} onChange={(e) => { setPostType(e.target.value); setVisibleCount(9); }} className="h-11 rounded-xl border border-amber-200 bg-white px-3 font-hindi text-sm">
            {postTypes.map((item) => <option key={item} value={item}>{item === "All" ? "All Post Types" : item.replace("_", " ")}</option>)}
          </select>
          <form onSubmit={onNewsletterSubmit} className="flex gap-2">
            <Input value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} type="email" placeholder="Email alerts for jobs and updates" className="h-11 rounded-xl border-amber-200" />
            <Button type="submit" className={cn("h-11 rounded-xl font-hindi", brandCtaClass)}>
              <Bell className="mr-2 h-4 w-4" />
              Subscribe
            </Button>
          </form>
        </div>

        {user && notifications.length > 0 && (
          <div className="mb-8 rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
            <p className="mb-2 flex items-center gap-2 font-hindi text-sm font-semibold text-sky-900">
              <Bell className="h-4 w-4" />
              Latest notifications
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {notifications.slice(0, 3).map((note) => (
                <Link key={note.id} to="/blog" className="rounded-xl bg-white px-3 py-2 font-hindi text-sm text-sky-950 shadow-sm">
                  {note.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mb-10 inline-flex rounded-full border border-amber-100/90 bg-white/70 p-1 shadow-md backdrop-blur-md">
          <Button type="button" variant={feedTab === "latest" ? "default" : "ghost"} size="sm" className={cn("rounded-full px-5 font-hindi", feedTab === "latest" && brandCtaClass)} onClick={() => setFeedTab("latest")}>
            <Sparkles className="mr-1.5 h-4 w-4" />
            {hi.tabLatest}
          </Button>
          <Button type="button" variant={feedTab === "trending" ? "default" : "ghost"} size="sm" className={cn("rounded-full px-5 font-hindi", feedTab === "trending" && brandCtaClass)} onClick={() => setFeedTab("trending")}>
            <TrendingUp className="mr-1.5 h-4 w-4" />
            {hi.tabTrending}
          </Button>
        </div>

        {error && <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-hindi text-sm text-red-800">{error}</div>}

        {!posts && <BlogCardGridSkeleton count={6} />}
        {posts && posts.length === 0 && <EmptyState icon={Sparkles} title={hi.emptyNoPosts} description={hi.emptyNoPostsDesc} />}

        {posts && posts.length > 0 && filtered.length === 0 && (
          <EmptyState
            icon={Search}
            title={hi.emptyNoMatch}
            description={hi.emptyNoMatchDesc}
            action={<Button variant="outline" className="rounded-full font-hindi" onClick={resetFilters}>{hi.resetFilters}</Button>}
          />
        )}

        {featured && <FeaturedArticle post={featured} />}

        {posts && filtered.length > 0 && trending.length > 0 && (
          <section className="mb-14">
            <SectionHeader eyebrow={hi.tabTrending} title={hi.trendingTitle} description={hi.trendingDesc} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((p, i) => <BlogCard key={p.id} post={p} index={i} />)}
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
              {visiblePosts.map((p, i) => <BlogCard key={p.id} post={p} index={i} />)}
            </div>
            {visiblePosts.length < gridPosts.length && (
              <div className="mt-8 text-center">
                <Button type="button" variant="outline" className="rounded-full px-8 font-hindi" onClick={() => setVisibleCount((count) => count + 9)}>
                  Load more
                </Button>
              </div>
            )}
          </section>
        )}
      </motion.div>
    </BlogShell>
  );
};

export default Blog;
