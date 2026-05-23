import { useEffect, useMemo, useState, FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, CheckCircle2, ExternalLink, Heart, MessageCircle, Share2, ArrowLeft, Text } from "lucide-react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { getPostByIdentifier, getPosts, incrementShareCount, recordPostView } from "@/services/posts";
import { getComments, addComment } from "@/services/comments";
import { getLikesCount, hasUserLiked, likePost, unlikePost } from "@/services/likes";
import {
  bookmarkPost,
  getReactionCounts,
  getUserReactions,
  hasUserBookmarked,
  toggleReaction,
  unbookmarkPost,
  type ReactionType,
} from "@/services/blogExtras";
import { useAuth } from "@/hooks/useAuth";
import { readTimeMinutes, postExcerpt, stripHtml } from "@/lib/blogUtils";
import { hi } from "@/lib/blogHindi";
import { brandCtaClass } from "@/lib/blogBrand";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BlogShell } from "@/components/blog/BlogShell";
import { SEO } from "@/components/seo/SEO";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { CommentCard, type CommentWithUser } from "@/components/blog/CommentCard";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { EmptyState } from "@/components/blog/EmptyState";
import { PostBody } from "@/components/blog/PostBody";
import { HindiTypography } from "@/components/blog/HindiTypography";
import type { PostWithAuthor } from "@/services/posts";
import { cn } from "@/lib/utils";

const BlogPost = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Awaited<ReturnType<typeof getPostByIdentifier>>>(null);
  const [related, setRelated] = useState<PostWithAuthor[]>([]);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({ helpful: 0, important: 0, informative: 0, urgent: 0 });
  const [userReactions, setUserReactions] = useState<Set<ReactionType>>(new Set());
  const [fontScale, setFontScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const postId = post?.id;

  useEffect(() => {
    if (!identifier) return;

    let cancelled = false;
    const loadPost = async () => {
      setLoading(true);

      try {
        const fetchedPost = await getPostByIdentifier(identifier);
        if (cancelled) return;

        setPost(fetchedPost);
        if (!fetchedPost) return;

        const [fetchedComments, fetchedLikes, fetchedLiked, fetchedBookmarked, fetchedReactionCounts, fetchedUserReactions, allPosts] = await Promise.all([
          getComments(fetchedPost.id),
          getLikesCount(fetchedPost.id),
          user ? hasUserLiked(fetchedPost.id, user.id) : Promise.resolve(false),
          user ? hasUserBookmarked(fetchedPost.id, user.id) : Promise.resolve(false),
          getReactionCounts(fetchedPost.id),
          user ? getUserReactions(fetchedPost.id, user.id) : Promise.resolve(new Set<ReactionType>()),
          getPosts(),
        ]);

        if (cancelled) return;

        setComments(fetchedComments as CommentWithUser[]);
        setLikes(fetchedLikes);
        setLiked(fetchedLiked);
        setBookmarked(fetchedBookmarked);
        setReactionCounts(fetchedReactionCounts);
        setUserReactions(fetchedUserReactions);
        setRelated(allPosts.filter((x) => x.id !== fetchedPost.id).slice(0, 3));
        void recordPostView(fetchedPost.id, user?.id);
      } catch {
        if (!cancelled) {
          toast.error(hi.toastLoadFail);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPost();
    return () => {
      cancelled = true;
    };
  }, [identifier, user]);

  const headings = useMemo(() => {
    if (!post?.content || typeof document === "undefined") return [];
    const wrapper = document.createElement("div");
    wrapper.innerHTML = post.content;
    return Array.from(wrapper.querySelectorAll("h2, h3")).slice(0, 8).map((heading, index) => ({
      id: `section-${index}`,
      text: heading.textContent?.trim() || `Section ${index + 1}`,
    }));
  }, [post?.content]);

  // If the user visited the old UUID URL, redirect to the slug URL for SEO
  useEffect(() => {
    if (!postId || !post) return;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(postId);
    if (isUuid && post.slug) {
      // Replace the URL with the SEO slug version
      const newUrl = `/blog/${post.slug}`;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [postId, post]);

  async function toggleLike() {
    if (!user || !postId) {
      toast.info(hi.toastSignInLike);
      return;
    }
    if (likeBusy) return;
    const prevLiked = liked;
    const prevLikes = likes;
    setLikeBusy(true);
    if (liked) {
      setLiked(false);
      setLikes((n) => Math.max(0, n - 1));
    } else {
      setLiked(true);
      setLikes((n) => n + 1);
    }
    try {
      if (prevLiked) {
        await unlikePost(postId, user.id);
      } else {
        await likePost(postId, user.id);
        toast.success(hi.toastThanksLike);
      }
    } catch {
      setLiked(prevLiked);
      setLikes(prevLikes);
      toast.error("पसंद अपडेट नहीं हो सका।");
    } finally {
      setLikeBusy(false);
    }
  }

  async function toggleBookmark() {
    if (!user || !postId) {
      toast.info("Please sign in to save this post.");
      return;
    }
    if (bookmarkBusy) return;
    const previous = bookmarked;
    setBookmarkBusy(true);
    setBookmarked(!previous);
    try {
      if (previous) await unbookmarkPost(postId, user.id);
      else {
        await bookmarkPost(postId, user.id);
        toast.success("Post saved.");
      }
    } catch {
      setBookmarked(previous);
      toast.error("Bookmark update failed.");
    } finally {
      setBookmarkBusy(false);
    }
  }

  async function onReaction(reaction: ReactionType) {
    if (!user || !postId) {
      toast.info("Please sign in to react.");
      return;
    }
    const active = userReactions.has(reaction);
    try {
      await toggleReaction(postId, user.id, reaction, active);
      const next = new Set(userReactions);
      if (active) next.delete(reaction);
      else next.add(reaction);
      setUserReactions(next);
      setReactionCounts((current) => ({
        ...current,
        [reaction]: Math.max(0, current[reaction] + (active ? -1 : 1)),
      }));
    } catch {
      toast.error("Reaction update failed.");
    }
  }

  async function onAddComment(e: FormEvent) {
    e.preventDefault();
    if (!user || !postId || !comment.trim()) return;
    setSubmitting(true);
    try {
      await addComment(postId, user.id, comment.trim());
      setComment("");
      const fresh = await getComments(postId);
      setComments(fresh as CommentWithUser[]);
      toast.success(hi.toastCommentOk);
    } catch {
      toast.error("टिप्पणी पोस्ट नहीं हो सकी।");
    } finally {
      setSubmitting(false);
    }
  }

  function shareArticle() {
    const url = window.location.href;
    const done = () => toast.info(hi.toastLinkCopied);
    if (navigator.share) {
      void navigator.share({ title: post?.title, url }).catch(() => {
        void navigator.clipboard.writeText(url).then(done);
      });
    } else {
      void navigator.clipboard.writeText(url).then(done);
    }
    if (postId) void incrementShareCount(postId, post?.share_count ?? 0).catch(() => undefined);
  }

  if (loading) {
    return (
      <BlogShell>
        <SkeletonTheme baseColor="#fef3c7" highlightColor="#fff7ed">
          <Skeleton height={36} width={160} className="mb-6" borderRadius={12} />
          <Skeleton height={52} width="85%" borderRadius={12} />
          <Skeleton height={20} width="40%" className="mt-4" borderRadius={8} />
          <Skeleton height={420} className="mt-8" borderRadius={24} />
          <Skeleton count={4} className="mt-8" borderRadius={8} />
        </SkeletonTheme>
      </BlogShell>
    );
  }

  if (!post) {
    return (
      <BlogShell>
        <EmptyState
          icon={MessageCircle}
          title={hi.notFound}
          description={hi.notFoundDesc}
          action={
            <Button asChild className={cn("px-8", brandCtaClass)}>
              <Link to="/blog">{hi.backToBlog}</Link>
            </Button>
          }
        />
      </BlogShell>
    );
  }

  const readMins = readTimeMinutes(post.content);

  const LikeControl = ({ className }: { className?: string }) => (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="flex flex-col items-center gap-1.5">
        <Button
          type="button"
          size="lg"
          disabled={likeBusy}
          onClick={() => void toggleLike()}
          className={cn(
            "h-14 w-14 rounded-2xl border-0 p-0 shadow-lg transition-all",
            liked
              ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/30"
              : "border border-amber-100 bg-white text-gray-800 shadow-md hover:bg-amber-50",
          )}
          aria-pressed={liked}
          aria-label={hi.likeLabel}
        >
          <motion.span
            key={liked ? "on" : "off"}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="flex items-center justify-center"
          >
            <Heart className={cn("h-6 w-6", liked && "fill-current")} />
          </motion.span>
        </Button>
        <span className="font-hindi text-xs font-semibold tabular-nums text-gray-600">
          {likes} {hi.likes}
        </span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-2xl border-amber-200 bg-white shadow-sm"
        onClick={shareArticle}
        aria-label={hi.share}
      >
        <Share2 className="h-5 w-5 text-amber-800" />
      </Button>
      <Button
        type="button"
        variant={bookmarked ? "default" : "outline"}
        size="icon"
        disabled={bookmarkBusy}
        className={cn("h-12 w-12 rounded-2xl border-amber-200 bg-white shadow-sm", bookmarked && brandCtaClass)}
        onClick={() => void toggleBookmark()}
        aria-label="Save post"
      >
        <Bookmark className={cn("h-5 w-5", bookmarked ? "fill-current text-white" : "text-amber-800")} />
      </Button>
    </div>
  );

  const description = postExcerpt(post.content) || stripHtml(post.content).slice(0, 160);
  const seoTitle = post.seo_title || `${post.title} - Malani Barmer Blog`;
  const seoDescription = post.seo_description || description;
  const authorName = post.author?.full_name || "Malani Barmer";
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: seoDescription,
    image: post.og_image_url || post.image_url ? [post.og_image_url || post.image_url] : undefined,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: { "@type": "Person", name: authorName },
    publisher: {
      "@type": "Organization",
      name: "Malani Barmer",
      logo: { "@type": "ImageObject", url: "https://malanibarmer.com/favicon.ico" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://malanibarmer.com/blog/${post.slug}` },
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://malanibarmer.com/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://malanibarmer.com/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://malanibarmer.com/blog/${post.slug}` },
    ],
  };

  return (
    <BlogShell>
      <SEO
        title={`${post.title} — Malani Barmer Blog`}
        description={seoDescription}
        path={`/blog/${post.slug}`}
        image={post.og_image_url || post.image_url || undefined}
        type="article"
        publishedAt={post.created_at}
        updatedAt={post.updated_at || post.created_at}
        author={authorName}
        jsonLd={[articleSchema, breadcrumbs]}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <Button variant="ghost" asChild className="-ml-4 mb-6 rounded-full font-hindi text-gray-600 hover:text-gray-900">
            <Link to="/blog" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {hi.backToBlog}
            </Link>
          </Button>

          <div className="lg:grid lg:grid-cols-[1fr_280px] lg:items-start lg:gap-12">
            <article>
              <header className="max-w-3xl">
                <p className="font-hindi text-sm font-semibold text-amber-700">{hi.article}</p>
                <HindiTypography as="h1" className="mt-2 text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                  {post.title}
                </HindiTypography>
                <div className="mt-4 flex flex-wrap items-center gap-3 font-hindi text-sm text-gray-600">
                  <span>{dayjs(post.created_at).format("D MMMM, YYYY")}</span>
                  <span className="hidden sm:inline">·</span>
                  <span>
                    {readMins} {hi.minRead}
                  </span>
                  <span className="hidden sm:inline">·</span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-4 w-4 text-sky-600" />
                    {comments.length} {hi.comments}
                  </span>
                  {post.category && (
                    <>
                      <span className="hidden sm:inline">·</span>
                      <span>{post.category}</span>
                    </>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(post.tags ?? []).map((tag) => (
                    <span key={tag} className="rounded-full bg-amber-50 px-3 py-1 font-hindi text-xs font-semibold text-amber-900">
                      {tag}
                    </span>
                  ))}
                  {post.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-hindi text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  )}
                </div>
              </header>

              {post.image_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.08, duration: 0.45 }}
                  className="relative mt-10 max-w-3xl overflow-hidden rounded-3xl border border-amber-100/80 bg-white shadow-2xl shadow-amber-900/10"
                >
                  <img src={post.image_url} alt="" className="aspect-[21/9] w-full object-cover sm:aspect-[2.2/1]" />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5" />
                </motion.div>
              )}

              {(post.official_link || post.source_url) && (
                <div className="mt-8 max-w-3xl rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 font-hindi text-sm text-emerald-950">
                  <p className="mb-2 font-semibold">Official information</p>
                  <div className="flex flex-wrap gap-2">
                    {post.official_link && (
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <a href={post.official_link} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Official Link
                        </a>
                      </Button>
                    )}
                    {post.source_url && (
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <a href={post.source_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Source
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {headings.length > 0 && (
                <nav className="mt-8 max-w-3xl rounded-2xl border border-amber-100 bg-white/80 p-4">
                  <p className="mb-3 font-hindi text-sm font-semibold text-gray-900">Table of contents</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {headings.map((heading) => (
                      <span key={heading.id} className="font-hindi text-sm text-amber-800">
                        {heading.text}
                      </span>
                    ))}
                  </div>
                </nav>
              )}

              <div className="mt-6 flex max-w-3xl items-center justify-end gap-2">
                <Text className="h-4 w-4 text-gray-500" />
                {[0.95, 1, 1.08].map((scale) => (
                  <Button key={scale} type="button" variant={fontScale === scale ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setFontScale(scale)}>
                    {scale === 0.95 ? "A-" : scale === 1 ? "A" : "A+"}
                  </Button>
                ))}
              </div>

              <div className="mt-4 max-w-3xl" style={{ fontSize: `${fontScale}rem` }}>
                <PostBody content={post.content} className="text-gray-900" />
              </div>

              <section className="mt-10 max-w-3xl rounded-2xl border border-amber-100 bg-white/80 p-4">
                <p className="mb-3 font-hindi text-sm font-semibold text-gray-900">Post reactions</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    ["helpful", "Helpful"],
                    ["important", "Important"],
                    ["informative", "Informative"],
                    ["urgent", "Urgent"],
                  ] as Array<[ReactionType, string]>).map(([key, label]) => (
                    <Button key={key} type="button" variant={userReactions.has(key) ? "default" : "outline"} size="sm" className={cn("rounded-full font-hindi", userReactions.has(key) && brandCtaClass)} onClick={() => void onReaction(key)}>
                      {label} · {reactionCounts[key]}
                    </Button>
                  ))}
                </div>
              </section>

              <div className="mt-12 max-w-3xl lg:hidden">
                <AuthorCard author={post.author} />
              </div>

              <section className="mt-14 max-w-3xl border-t border-amber-100/90 pt-10">
                <div className="mb-6 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-amber-700" />
                  <h2 className="font-hindi text-2xl font-bold tracking-tight text-gray-900">{hi.discussion}</h2>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 font-hindi text-xs font-semibold text-amber-900">
                    {comments.length}
                  </span>
                </div>

                {user ? (
                  <form onSubmit={onAddComment} className="mb-8 space-y-3">
                    <Textarea
                      placeholder={hi.commentPlaceholder}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[120px] resize-none rounded-2xl border-amber-200/80 bg-white/90 font-hindi text-base shadow-inner backdrop-blur-sm"
                      required
                    />
                    <Button type="submit" disabled={submitting || !comment.trim()} className={cn("rounded-full px-8", brandCtaClass)}>
                      {submitting ? hi.posting : hi.postComment}
                    </Button>
                  </form>
                ) : (
                  <p className="mb-8 rounded-2xl border border-dashed border-amber-200/80 bg-amber-50/50 px-4 py-4 font-hindi text-sm text-gray-700">
                    <Link to="/login" className="font-semibold text-amber-800 underline-offset-4 hover:underline">
                      {hi.signIn}
                    </Link>{" "}
                    {hi.signInToComment}
                  </p>
                )}

                <div className="space-y-4">
                  {comments.map((c, i) => (
                    <CommentCard key={c.id} comment={c} index={i} />
                  ))}
                  {comments.length === 0 && (
                    <p className="rounded-2xl bg-amber-50/60 px-4 py-8 text-center font-hindi text-sm text-gray-600">{hi.noCommentsYet}</p>
                  )}
                </div>
              </section>

              <RelatedPosts posts={related} />
            </article>

            <aside className="sticky top-28 mt-4 hidden space-y-6 lg:mt-0 lg:block">
              <LikeControl />
              <AuthorCard author={post.author} />
            </aside>
          </div>

          <div className="fixed bottom-6 right-4 z-40 flex flex-col items-center lg:hidden">
            <LikeControl />
          </div>
        </motion.div>
      </AnimatePresence>
    </BlogShell>
  );
};

export default BlogPost;
