import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { JobCard, JobCardSkeleton } from "@/components/jobs/JobCard";
import { countdownLabel, postTypeShort, statusClasses, TYPE_TEXT } from "@/lib/jobs";
import { formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PostListItem } from "@/services/posts";

export function CardGrid({ posts, loading, skeletons = 6, className }: { posts?: PostListItem[]; loading?: boolean; skeletons?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {loading && !posts?.length
        ? Array.from({ length: skeletons }, (_, i) => <JobCardSkeleton key={i} />)
        : posts?.map((p) => <JobCard key={p.id} post={p} />)}
    </div>
  );
}

/** Horizontal snap carousel on mobile, grid on desktop. */
export function CardRail({ posts, loading }: { posts?: PostListItem[]; loading?: boolean }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:overflow-visible sm:px-0">
      <div className="flex snap-x snap-mandatory gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {loading && !posts?.length
          ? Array.from({ length: 4 }, (_, i) => <JobCardSkeleton key={i} className="w-[85%] shrink-0 snap-start sm:w-auto" />)
          : posts?.map((p) => <JobCard key={p.id} post={p} className="w-[85%] shrink-0 snap-start sm:w-auto" />)}
      </div>
    </div>
  );
}

/** Right-hand deadline chip: "3 दिन बचे" when close, "6 नवं तक" otherwise, "बंद" once the date has passed. */
export function DeadlineChip({ post, className }: { post: Pick<PostListItem, "last_date" | "job_status" | "days_left">; className?: string }) {
  if (!post.last_date || !post.job_status) return null;
  const label =
    post.job_status === "closed" ? "बंद" : post.job_status === "closing" ? countdownLabel(post.last_date) : `${formatDate(post.last_date, { withYear: false })} तक`;
  return (
    <span
      className={cn("shrink-0 whitespace-nowrap rounded-lg px-2 py-1 font-hindi text-caption tabular", statusClasses(post.job_status, post.days_left), className)}
      aria-label={post.job_status === "closed" ? "आवेदन बंद" : `अंतिम तिथि ${formatDate(post.last_date)}`}
    >
      {label}
    </span>
  );
}

/** Compact "today's updates" list: type, time, title and a deadline chip for jobs. */
export function UpdateList({ posts, loading }: { posts?: PostListItem[]; loading?: boolean }) {
  if (loading && !posts?.length) {
    return (
      <ul className="divide-y rounded-xl border bg-card" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-5 w-16 animate-pulse rounded bg-muted" />
            <div className="h-5 flex-1 animate-pulse rounded bg-muted" />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="divide-y rounded-xl border bg-card shadow-1">
      {posts?.map((p) => (
        <li key={p.id}>
          <Link to={`/blog/${p.slug}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60">
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-caption">
                <span className={cn("font-hindi font-bold", TYPE_TEXT[p.post_type ?? "article"])}>{postTypeShort(p.post_type)}</span>
                <span aria-hidden className="h-1 w-1 rounded-full bg-border" />
                <span className="font-normal text-muted-foreground tabular">{timeAgo(p.published_at)}</span>
              </span>
              <span className="mt-0.5 line-clamp-2 block font-hindi text-body font-semibold leading-snug text-foreground">{p.title}</span>
            </span>
            <DeadlineChip post={p} />
            <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
