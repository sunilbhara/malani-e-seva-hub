import { useEffect, useState, FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { getPostById, getPosts } from "@/services/posts";
import { getComments, addComment } from "@/services/comments";
import { getLikesCount, hasUserLiked, likePost, unlikePost } from "@/services/likes";
import { useAuth } from "@/hooks/useAuth";
import { readTimeMinutes } from "@/lib/blogUtils";
import { hi } from "@/lib/blogHindi";
import { brandCtaClass } from "@/lib/blogBrand";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BlogShell } from "@/components/blog/BlogShell";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { CommentCard, type CommentWithUser } from "@/components/blog/CommentCard";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { EmptyState } from "@/components/blog/EmptyState";
import { PostBody } from "@/components/blog/PostBody";
import { HindiTypography } from "@/components/blog/HindiTypography";
import type { PostWithAuthor } from "@/services/posts";
import { cn } from "@/lib/utils";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Awaited<ReturnType<typeof getPostById>>>(null);
  const [related, setRelated] = useState<PostWithAuthor[]>([]);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getPostById(id),
      getComments(id),
      getLikesCount(id),
      user ? hasUserLiked(id, user.id) : Promise.resolve(false),
      getPosts(),
    ])
      .then(([p, c, l, hl, allPosts]) => {
        setPost(p);
        setComments(c as CommentWithUser[]);
        setLikes(l);
        setLiked(hl);
        setRelated(allPosts.filter((x) => x.id !== id).slice(0, 3));
      })
      .catch(() => toast.error(hi.toastLoadFail))
      .finally(() => setLoading(false));
  }, [id, user]);

  async function toggleLike() {
    if (!user || !id) {
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
        await unlikePost(id, user.id);
      } else {
        await likePost(id, user.id);
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

  async function onAddComment(e: FormEvent) {
    e.preventDefault();
    if (!user || !id || !comment.trim()) return;
    setSubmitting(true);
    try {
      await addComment(id, user.id, comment.trim());
      setComment("");
      const fresh = await getComments(id);
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
    </div>
  );

  return (
    <BlogShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-7xl"
        >
          <Button variant="ghost" asChild className="-ml-2 mb-6 rounded-full font-hindi text-gray-600 hover:text-gray-900">
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

              <div className="mt-10 max-w-3xl">
                <PostBody content={post.content} className="text-gray-900" />
              </div>

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
