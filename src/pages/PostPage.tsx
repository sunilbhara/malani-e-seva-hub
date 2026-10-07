import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellRing,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  ListTree,
  MessageCircle,
  SearchX,
  Share2,
  ThumbsUp,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SEO } from "@/components/seo/SEO";
import { EmptyState, SectionHeading } from "@/components/common/EmptyState";
import { PageSpinner } from "@/components/common/PageSpinner";
import { DatesTable, FeeTable, QuickFacts } from "@/components/jobs/JobFacts";
import { CountdownChip, StatusBadge } from "@/components/jobs/StatusBadge";
import { CardGrid } from "@/components/jobs/PostList";
import { FormHelpCard } from "@/components/engagement/FormHelpCard";
import { QaSection } from "@/components/post/QaSection";
import { AdSlot } from "@/components/common/AdSlot";
import { useAuth } from "@/hooks/useAuth";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { getPost, getRelatedPosts, recordView, type PostDetail } from "@/services/posts";
import { hasLiked, setLiked } from "@/services/engagement";
import { listFollows, listReminderPostIds, reminderIcs, setApplied, setFollow, setReminder } from "@/services/tracker";
import { queryKeys } from "@/lib/queryClient";
import { preparePostHtml } from "@/lib/html";
import { daysUntil, formatDate, formatDateTime, istDateOf } from "@/lib/format";
import { jobStatus, postTypeLabel, TYPE_TEXT } from "@/lib/jobs";
import { buildArticleSchema, buildBreadcrumbSchema, buildJobPostingSchema } from "@/lib/seo";
import { postUrl } from "@/lib/share";
import { safeHttpUrl, loginUrl } from "@/lib/url";
import { whatsappHref } from "@/lib/business";
import { formHelpMessage } from "@/lib/share";
import { pushSupported, subscribeToPush } from "@/lib/push";
import { loadPreferences, topicsFor } from "@/lib/preferences";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const ShareSheet = lazy(() => import("@/components/post/ShareSheet").then((m) => ({ default: m.ShareSheet })));

const FONT_SCALES = [0.9, 1, 1.15, 1.3];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hostOf(url: string | null): string | null {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
}

export default function PostPage() {
  const { identifier = "" } = useParams<{ identifier: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isSaved, toggle: toggleSaved } = useSavedPosts();
  const [tocOpen, setTocOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [scaleIndex, setScaleIndex] = useState(1);
  const viewed = useRef<string | null>(null);

  const postQuery = useQuery({ queryKey: queryKeys.post(identifier), queryFn: () => getPost(identifier), enabled: Boolean(identifier) });
  const post = postQuery.data ?? null;

  // Old UUID links redirect to the canonical slug URL.
  useEffect(() => {
    if (post && UUID.test(identifier) && post.slug && post.status === "published") {
      navigate(`/blog/${post.slug}${location.hash}`, { replace: true });
    }
  }, [post, identifier, navigate, location.hash]);

  // One view per post per visit (deduplicated per day in the database).
  useEffect(() => {
    if (!post || post.status !== "published" || viewed.current === post.id) return;
    viewed.current = post.id;
    void recordView(post.id);
    track("job_view", { post_type: post.post_type ?? "article", department: post.job?.departments?.[0] });
  }, [post]);

  const related = useQuery({
    queryKey: queryKeys.related(post?.id ?? ""),
    queryFn: () => getRelatedPosts(post!),
    enabled: Boolean(post?.id),
  });

  const liked = useQuery({
    queryKey: queryKeys.liked(post?.id ?? "", user?.id ?? ""),
    queryFn: () => hasLiked(post!.id, user!.id),
    enabled: Boolean(post?.id && user),
  });

  const follows = useQuery({
    queryKey: queryKeys.follows(user?.id ?? ""),
    queryFn: () => listFollows(user!.id),
    enabled: Boolean(user && post?.job?.recruitment_id),
  });

  const reminders = useQuery({
    queryKey: queryKeys.reminders(user?.id ?? ""),
    queryFn: () => listReminderPostIds(user!.id),
    enabled: Boolean(user && post?.job?.last_date),
  });

  const prepared = useMemo(() => (post ? preparePostHtml(post.content) : { html: "", headings: [] }), [post]);

  useEffect(() => {
    document.documentElement.style.setProperty("--post-font-scale", String(FONT_SCALES[scaleIndex]));
    return () => document.documentElement.style.setProperty("--post-font-scale", "1");
  }, [scaleIndex]);

  if (postQuery.isLoading) return <PageSpinner />;
  if (postQuery.isError || !post) {
    return (
      <div className="container-page py-10">
        <SEO title="पोस्ट नहीं मिली | मालाणी बाड़मेर" description="यह पोस्ट हटा दी गई है या लिंक गलत है।" path={location.pathname} noindex />
        <EmptyState
          headingLevel={1}
          icon={SearchX}
          title={postQuery.isError ? "पोस्ट लोड नहीं हो सकी" : "पोस्ट नहीं मिली"}
          description={postQuery.isError ? "इंटरनेट कनेक्शन जाँचें और दोबारा कोशिश करें।" : "यह पोस्ट हटा दी गई है या लिंक गलत है।"}
          action={
            <Button asChild className="font-hindi">
              <Link to="/jobs">नौकरियाँ देखें</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <PostView
      post={post}
      html={prepared.html}
      headings={prepared.headings}
      related={related.data}
      relatedLoading={related.isLoading}
      liked={liked.data ?? false}
      onToggleLike={async () => {
        if (!user) {
          toast.info("उपयोगी बताने के लिए साइन इन करें");
          navigate(loginUrl(location.pathname));
          return;
        }
        const next = !(liked.data ?? false);
        queryClient.setQueryData(queryKeys.liked(post.id, user.id), next);
        queryClient.setQueryData<PostDetail | null>(queryKeys.post(identifier), (p) => (p ? { ...p, likes_count: Math.max(0, p.likes_count + (next ? 1 : -1)) } : p));
        try {
          await setLiked(post.id, user.id, next);
        } catch {
          queryClient.setQueryData(queryKeys.liked(post.id, user.id), !next);
          toast.error("अपडेट नहीं हो सका");
        }
      }}
      saved={isSaved(post.id)}
      onToggleSave={async () => {
        try {
          const now = await toggleSaved(post.id);
          toast.success(now ? "सेव हो गया — मेरी नौकरियाँ में देखें" : "सेव से हटाया गया");
        } catch {
          toast.error("सेव नहीं हो सका");
        }
      }}
      following={Boolean(follows.data?.some((f) => f.recruitment_id === post.job?.recruitment_id))}
      applied={Boolean(follows.data?.find((f) => f.recruitment_id === post.job?.recruitment_id)?.applied)}
      onFollow={async (follow) => {
        if (!user || !post.job?.recruitment_id) {
          navigate(loginUrl(location.pathname));
          return;
        }
        await setFollow(post.job.recruitment_id, user.id, follow);
        if (follow) track("follow_recruitment");
        void queryClient.invalidateQueries({ queryKey: queryKeys.follows(user.id) });
        toast.success(follow ? "फॉलो किया — इस भर्ती की हर अपडेट आपको मिलेगी" : "फॉलो हटाया");
      }}
      onApplied={async (applied) => {
        if (!user || !post.job?.recruitment_id) {
          navigate(loginUrl(location.pathname));
          return;
        }
        await setApplied(post.job.recruitment_id, user.id, applied);
        if (applied) track("mark_applied");
        void queryClient.invalidateQueries({ queryKey: queryKeys.follows(user.id) });
        toast.success(applied ? "बढ़िया! मेरी नौकरियाँ में ट्रैकर बन गया" : "हटाया गया");
      }}
      reminderSet={Boolean(reminders.data?.includes(post.id))}
      onReminder={async () => {
        const lastDate = post.job?.last_date;
        if (!lastDate) return;
        const already = Boolean(reminders.data?.includes(post.id));
        try {
          if (user) {
            await setReminder(post.id, user.id, !already);
            void queryClient.invalidateQueries({ queryKey: queryKeys.reminders(user.id) });
            if (!already && pushSupported() && Notification.permission === "default") {
              await subscribeToPush(topicsFor(loadPreferences())).catch(() => undefined);
            }
          } else if (pushSupported() && Notification.permission !== "denied") {
            await subscribeToPush(topicsFor(loadPreferences()));
            await setReminder(post.id, null, true);
          } else {
            throw new Error("NEEDS_PUSH");
          }
          if (!already) track("reminder_set", { method: user ? "account" : "push" });
          toast.success(already ? "रिमाइंडर हटाया" : "रिमाइंडर लग गया — अंतिम तिथि से 3 दिन और 1 दिन पहले याद दिलाएँगे");
        } catch {
          // Fallback: calendar file works on every phone.
          const ics = reminderIcs(post.title, lastDate, postUrl(post.slug));
          const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
          const a = document.createElement("a");
          a.href = url;
          a.download = `${post.slug}-reminder.ics`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          track("reminder_set", { method: "calendar" });
          toast.success("कैलेंडर रिमाइंडर डाउनलोड हुआ — इसे खोलकर सेव करें");
        }
      }}
      tocOpen={tocOpen}
      setTocOpen={setTocOpen}
      shareOpen={shareOpen}
      setShareOpen={setShareOpen}
      scaleIndex={scaleIndex}
      setScaleIndex={setScaleIndex}
    />
  );
}

interface PostViewProps {
  post: PostDetail;
  html: string;
  headings: ReturnType<typeof preparePostHtml>["headings"];
  related?: Awaited<ReturnType<typeof getRelatedPosts>>;
  relatedLoading: boolean;
  liked: boolean;
  onToggleLike: () => Promise<void>;
  saved: boolean;
  onToggleSave: () => Promise<void>;
  following: boolean;
  applied: boolean;
  onFollow: (follow: boolean) => Promise<void>;
  onApplied: (applied: boolean) => Promise<void>;
  reminderSet: boolean;
  onReminder: () => Promise<void>;
  tocOpen: boolean;
  setTocOpen: (v: boolean) => void;
  shareOpen: boolean;
  setShareOpen: (v: boolean) => void;
  scaleIndex: number;
  setScaleIndex: (v: number) => void;
}

function PostView(props: PostViewProps) {
  const { post, html, headings } = props;
  const job = post.job;
  const status = job ? jobStatus(job.last_date, job.apply_start) : null;
  const applyLink = safeHttpUrl(job?.apply_link);
  const links = [
    { label: "आधिकारिक अधिसूचना (PDF)", href: safeHttpUrl(job?.notification_pdf), icon: FileText },
    { label: "ऑनलाइन आवेदन", href: applyLink, icon: ExternalLink },
    { label: "आधिकारिक वेबसाइट", href: safeHttpUrl(job?.official_website) ?? safeHttpUrl(post.official_link), icon: Globe },
    { label: "स्रोत", href: safeHttpUrl(post.source_url), icon: ExternalLink },
  ].filter((l): l is { label: string; href: string; icon: typeof FileText } => Boolean(l.href));
  const source = hostOf(safeHttpUrl(job?.official_website) ?? safeHttpUrl(post.official_link) ?? safeHttpUrl(post.source_url));
  const description = post.seo_description || post.excerpt || "";
  const image = post.og_image_url || post.image_url;
  const publishedDate = istDateOf(post.published_at);

  const jsonLd: Record<string, unknown>[] = [
    buildBreadcrumbSchema([
      { name: "होम", path: "/" },
      { name: post.post_type === "job" ? "नौकरियाँ" : postTypeLabel(post.post_type), path: post.post_type === "job" ? "/jobs" : "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
    buildArticleSchema({ title: post.title, description, slug: post.slug, image, publishedAt: post.published_at, updatedAt: post.updated_at }),
  ];
  if (post.post_type === "job" && job?.last_date && status !== "closed" && post.published_at) {
    jsonLd.push(
      buildJobPostingSchema({
        title: post.title,
        descriptionHtml: html || description,
        slug: post.slug,
        organisation: job.organisation,
        publishedAt: post.published_at,
        lastDate: job.last_date,
        totalPosts: job.total_posts,
        qualifications: job.qualifications,
        state: job.state,
        officialWebsite: safeHttpUrl(job.official_website),
      }),
    );
  }

  return (
    <article className="pb-24 lg:pb-8">
      <SEO
        title={post.seo_title || `${post.title} | मालाणी बाड़मेर`}
        description={description}
        path={`/blog/${post.slug}`}
        image={image}
        type="article"
        lang={post.language === "en" ? "en" : "hi"}
        publishedAt={post.published_at}
        updatedAt={post.updated_at}
        noindex={post.status !== "published"}
        jsonLd={jsonLd}
      />

      {post.status !== "published" && (
        <div className="bg-accent-soft py-2 text-center font-hindi text-small text-foreground">
          पूर्वावलोकन — यह पोस्ट अभी प्रकाशित नहीं है ({post.status})
        </div>
      )}

      <div className="container-page grid gap-10 pt-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {/* Breadcrumb + badges */}
          <nav aria-label="ब्रेडक्रंब" className="flex flex-wrap items-center gap-1 font-hindi text-small text-muted-foreground">
            <Link to="/" className="hover:text-foreground">होम</Link>
            <ChevronRight aria-hidden className="h-4 w-4" />
            <Link to={post.post_type === "job" ? "/jobs" : "/blog"} className={cn("font-semibold hover:underline", TYPE_TEXT[post.post_type ?? "article"])}>
              {postTypeLabel(post.post_type)}
            </Link>
          </nav>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={status} daysLeft={daysUntil(job?.last_date)} />
            {post.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-status-open-bg px-2.5 py-1 font-hindi text-caption text-status-open">
                <CheckCircle2 className="h-3.5 w-3.5" /> आधिकारिक स्रोत से सत्यापित
              </span>
            )}
          </div>

          <h1 className="mt-3 font-hindi text-[1.625rem] font-bold leading-tight sm:text-[2.25rem]">{post.title}</h1>
          <p className="mt-2 font-hindi text-small text-muted-foreground">
            {publishedDate && <>प्रकाशित: {formatDate(publishedDate)} · </>}
            अपडेट: {formatDateTime(post.updated_at)}
            {source && <> · स्रोत: {source}</>}
          </p>

          {job && <QuickFacts job={job} className="mt-5" />}

          {job?.last_date && (
            <div className="mt-3">
              <CountdownChip lastDate={job.last_date} status={status} className="text-small" />
              <span className="ml-2 font-hindi text-small text-muted-foreground">अंतिम तिथि {formatDate(job.last_date)}</span>
            </div>
          )}

          {/* Primary actions */}
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {applyLink && status !== "closed" && (
              <Button asChild size="lg" className="font-hindi">
                <a href={applyLink} target="_blank" rel="noopener noreferrer nofollow">आवेदन करें <ExternalLink /></a>
              </Button>
            )}
            {post.post_type === "job" || job ? (
              <Button asChild size="lg" variant="accent" className="font-hindi">
                <a href={whatsappHref(formHelpMessage(post.title))} target="_blank" rel="noopener noreferrer" onClick={() => track("form_help_click", { from: "post_actions" })}>
                  फॉर्म हमसे भरवाएँ
                </a>
              </Button>
            ) : null}
            {job?.last_date && status !== "closed" && (
              <Button type="button" size="lg" variant={props.reminderSet ? "secondary" : "outline"} className="font-hindi" onClick={() => void props.onReminder()}>
                <BellRing /> {props.reminderSet ? "रिमाइंडर लगा है" : "मुझे याद दिलाएँ"}
              </Button>
            )}
          </div>

          {image && (
            <img
              src={image}
              alt={post.title}
              width={1200}
              height={630}
              loading="eager"
              fetchPriority="high"
              className="mt-6 aspect-[1200/630] w-full rounded-2xl border object-cover"
            />
          )}

          {job && (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <DatesTable job={job} />
              <FeeTable job={job} />
            </div>
          )}

          {/* Reader controls */}
          <div className="mt-8 flex items-center justify-between gap-2 border-y py-2">
            {headings.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => props.setTocOpen(true)} className="font-hindi">
                <ListTree /> विषय-सूची
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-1" role="group" aria-label="अक्षर का आकार">
              <Type aria-hidden className="h-4 w-4 text-muted-foreground" />
              {FONT_SCALES.map((scale, i) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => props.setScaleIndex(i)}
                  aria-pressed={props.scaleIndex === i}
                  aria-label={`अक्षर आकार ${i + 1}`}
                  className={cn("grid h-9 w-9 place-items-center rounded-lg font-semibold", props.scaleIndex === i ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted")}
                  style={{ fontSize: `${0.75 + i * 0.125}rem` }}
                >
                  अ
                </button>
              ))}
            </div>
          </div>

          {/* Desktop inline TOC */}
          {headings.length > 2 && (
            <nav aria-label="विषय-सूची" className="mt-6 hidden rounded-2xl border bg-card p-4 md:block">
              <p className="mb-2 font-hindi font-semibold">विषय-सूची</p>
              <ol className="grid gap-1.5 sm:grid-cols-2">
                {headings.filter((h) => h.level === 2).map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="font-hindi text-small text-primary hover:underline">{h.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className="post-body mt-6 font-hindi" lang={post.language === "en" ? "en" : "hi"} dangerouslySetInnerHTML={{ __html: html }} />

          <AdSlot className="mt-10" />

          {links.length > 0 && (
            <section aria-labelledby="links-heading" className="mt-10">
              <h2 id="links-heading" className="mb-3 font-hindi text-lg font-bold">महत्वपूर्ण लिंक</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {links.map(({ label, href, icon: Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="flex min-h-14 items-center gap-3 rounded-xl border bg-card px-4 font-hindi font-semibold text-primary transition-colors hover:bg-muted">
                      <Icon aria-hidden className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{label}</span>
                      <ExternalLink aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Follow + applied (Loop 3) */}
          {job?.recruitment_id && (
            <section className="mt-8 rounded-2xl border bg-secondary/40 p-5">
              <h2 className="font-hindi text-lg font-bold">इस भर्ती की हर अपडेट पाएँ</h2>
              <p className="mt-1 font-hindi text-small text-muted-foreground">एडमिट कार्ड, परीक्षा तिथि और रिजल्ट आते ही सूचना मिलेगी।</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant={props.following ? "secondary" : "default"} className="font-hindi" onClick={() => void props.onFollow(!props.following)}>
                  <BellRing /> {props.following ? "फॉलो कर रहे हैं" : "भर्ती फॉलो करें"}
                </Button>
                <Button type="button" variant={props.applied ? "secondary" : "outline"} className="font-hindi" onClick={() => void props.onApplied(!props.applied)}>
                  <CheckCircle2 /> {props.applied ? "आवेदन किया ✓" : "मैंने आवेदन किया"}
                </Button>
              </div>
            </section>
          )}

          {/* Was this helpful */}
          <section className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
            <p className="flex-1 font-hindi font-semibold">क्या यह जानकारी उपयोगी लगी?</p>
            <Button type="button" variant={props.liked ? "default" : "outline"} onClick={() => void props.onToggleLike()} className="font-hindi" aria-pressed={props.liked}>
              <ThumbsUp /> उपयोगी <span className="tabular">({post.likes_count})</span>
            </Button>
            <Button type="button" variant="outline" onClick={() => props.setShareOpen(true)} className="font-hindi">
              <Share2 /> शेयर करें
            </Button>
          </section>

          <FormHelpCard postTitle={post.title} className="mt-8" />

          <div className="mt-10">
            <QaSection postId={post.id} returnPath={`/blog/${post.slug}`} />
          </div>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            {headings.length > 1 && (
              <nav aria-label="विषय-सूची (साइड)" className="rounded-2xl border bg-card p-4">
                <p className="mb-2 font-hindi font-semibold">विषय-सूची</p>
                <ol className="space-y-1.5">
                  {headings.map((h) => (
                    <li key={h.id} className={h.level === 3 ? "pl-3" : ""}>
                      <a href={`#${h.id}`} className="font-hindi text-small text-muted-foreground hover:text-primary">{h.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={props.saved ? "secondary" : "outline"} onClick={() => void props.onToggleSave()} className="font-hindi">
                <Bookmark className={cn(props.saved && "fill-current")} /> {props.saved ? "सेव है" : "सेव करें"}
              </Button>
              <Button type="button" variant="whatsapp" onClick={() => props.setShareOpen(true)} className="font-hindi">
                <MessageCircle /> शेयर
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Related */}
      <section aria-labelledby="related-heading" className="container-page mt-12">
        <SectionHeading id="related-heading" title="इन्हें भी देखें" />
        <CardGrid posts={props.related} loading={props.relatedLoading} skeletons={3} />
      </section>

      {/* Mobile contextual action bar (replaces the bottom nav on posts, audit U5) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto grid h-16 max-w-xl grid-cols-[auto_auto_1fr] items-center gap-2 px-3">
          <button
            type="button"
            onClick={() => void props.onToggleSave()}
            aria-pressed={props.saved}
            className={cn("flex h-12 w-14 flex-col items-center justify-center rounded-xl font-hindi text-[0.6875rem] font-semibold", props.saved ? "text-primary" : "text-muted-foreground")}
          >
            <Bookmark className={cn("h-5 w-5", props.saved && "fill-current")} /> सेव
          </button>
          <button
            type="button"
            onClick={() => props.setShareOpen(true)}
            className="flex h-12 w-14 flex-col items-center justify-center rounded-xl font-hindi text-[0.6875rem] font-semibold text-muted-foreground"
          >
            <Share2 className="h-5 w-5" /> शेयर
          </button>
          <Button asChild variant="accent" className="h-12 font-hindi text-[1rem]">
            <a href={whatsappHref(formHelpMessage(post.title))} target="_blank" rel="noopener noreferrer" onClick={() => track("form_help_click", { from: "action_bar" })}>
              फॉर्म भरवाएँ
            </a>
          </Button>
        </div>
      </div>

      {/* Mobile TOC sheet */}
      <Sheet open={props.tocOpen} onOpenChange={props.setTocOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-xl">
          <SheetHeader className="text-left">
            <SheetTitle className="font-hindi">विषय-सूची</SheetTitle>
          </SheetHeader>
          <ol className="mt-4 space-y-1">
            {headings.map((h) => (
              <li key={h.id} className={h.level === 3 ? "pl-4" : ""}>
                <a href={`#${h.id}`} onClick={() => props.setTocOpen(false)} className="block rounded-lg px-3 py-2.5 font-hindi text-body hover:bg-muted">
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </SheetContent>
      </Sheet>

      {props.shareOpen && (
        <Suspense fallback={null}>
          <ShareSheet
            open={props.shareOpen}
            onOpenChange={props.setShareOpen}
            postId={post.id}
            post={{ title: post.title, slug: post.slug, totalPosts: job?.total_posts, lastDate: job?.last_date }}
            organisation={job?.organisation}
            qualifications={job?.qualifications}
            postType={post.post_type}
          />
        </Suspense>
      )}
    </article>
  );
}
