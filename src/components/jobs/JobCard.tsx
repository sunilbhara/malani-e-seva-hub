import { Link } from "react-router-dom";
import { Bookmark, CalendarDays, GraduationCap, Share2, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber, timeAgo } from "@/lib/format";
import { postTypeShort, qualificationLabel, TYPE_TEXT } from "@/lib/jobs";
import { shareText, whatsappShareUrl } from "@/lib/share";
import { track } from "@/lib/analytics";
import { recordShare, type PostListItem } from "@/services/posts";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { CountdownChip, StatusBadge } from "@/components/jobs/StatusBadge";

/** Job card (Blueprint §10.1): whole card tappable, facts row, countdown, save and WhatsApp share. */
export function JobCard({ post, className, compact = false }: { post: PostListItem; className?: string; compact?: boolean }) {
  const { isSaved, toggle } = useSavedPosts();
  const saved = isSaved(post.id);
  const closed = post.job_status === "closed";
  const quals = (post.qualifications ?? []).filter((q) => q !== "any").map(qualificationLabel);

  async function onSave() {
    try {
      const nowSaved = await toggle(post.id);
      toast.success(nowSaved ? "सेव हो गया — मेरी नौकरियाँ में देखें" : "सेव से हटाया गया");
    } catch {
      toast.error("सेव नहीं हो सका। दोबारा कोशिश करें।");
    }
  }

  function onShare() {
    void recordShare(post.id, "whatsapp");
    track("share_whatsapp", { post_type: post.post_type ?? "article", from: "card" });
  }

  return (
    <article
      className={cn(
        // min-w-0: never let a long organisation name widen the card (it truncates instead).
        "group relative flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 shadow-1 transition-[box-shadow,border-color] hover:border-input hover:shadow-2",
        // Closed jobs are muted with a tinted background, not opacity, so text keeps WCAG AA contrast.
        closed && "bg-muted/60",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-small">
          <span className={cn("shrink-0 font-hindi font-bold", TYPE_TEXT[post.post_type ?? "article"])}>{postTypeShort(post.post_type)}</span>
          {post.organisation && (
            <>
              <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-border" />
              <span className="min-w-0 truncate font-semibold text-muted-foreground">{post.organisation}</span>
            </>
          )}
        </p>
        {post.job_status ? (
          <StatusBadge status={post.job_status} daysLeft={post.days_left} className="shrink-0" />
        ) : (
          <span className="shrink-0 text-caption font-normal text-muted-foreground tabular">{timeAgo(post.published_at)}</span>
        )}
      </div>

      <h3 className="font-hindi text-[1.125rem] font-semibold leading-snug text-foreground">
        <Link to={`/blog/${post.slug}`} className="line-clamp-2 after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
          {post.title}
        </Link>
      </h3>

      {!compact && (post.total_posts || quals.length || post.last_date) ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 font-hindi text-small text-muted-foreground">
          {post.total_posts ? (
            <li className="inline-flex items-center gap-1.5">
              <Users aria-hidden className="h-4 w-4" />
              <span className="tabular">{formatNumber(post.total_posts)} पद</span>
            </li>
          ) : null}
          {quals.length ? (
            <li className="inline-flex items-center gap-1.5">
              <GraduationCap aria-hidden className="h-4 w-4" />
              {quals.slice(0, 2).join(", ")}
            </li>
          ) : null}
          {post.last_date ? (
            <li className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden className="h-4 w-4" />
              <span className="tabular">{formatDate(post.last_date)}</span>
            </li>
          ) : null}
        </ul>
      ) : null}

      {!compact && !post.job_status && post.excerpt ? (
        <p className="line-clamp-2 font-hindi text-small text-muted-foreground">{post.excerpt}</p>
      ) : null}

      <div className="relative z-10 mt-auto flex items-center justify-between gap-2 border-t pt-3">
        <CountdownChip lastDate={post.last_date} status={post.job_status} />
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => void onSave()}
            aria-pressed={saved}
            aria-label={saved ? "सेव से हटाएँ" : "सेव करें"}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-muted",
              saved ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
          </button>
          <a
            href={whatsappShareUrl(shareText({ title: post.title, slug: post.slug, totalPosts: post.total_posts, lastDate: post.last_date }))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onShare}
            aria-label="WhatsApp पर शेयर करें"
            className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Share2 className="h-5 w-5" />
          </a>
        </div>
      </div>
    </article>
  );
}

export function JobCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border bg-card p-4", className)} aria-hidden>
      <div className="flex justify-between">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="h-5 w-11/12 animate-pulse rounded bg-muted" />
      <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      <div className="mt-1 flex justify-between">
        <div className="h-7 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-20 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
