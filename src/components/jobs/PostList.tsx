import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { JobCard, JobCardSkeleton } from "@/components/jobs/JobCard";
import { postTypeShort, TYPE_TEXT } from "@/lib/jobs";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PostListItem } from "@/services/posts";

export function CardGrid({ posts, loading, skeletons = 6, className }: { posts?: PostListItem[]; loading?: boolean; skeletons?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
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

/** Compact "today's updates" list: type, title, time. */
export function UpdateList({ posts, loading }: { posts?: PostListItem[]; loading?: boolean }) {
  if (loading && !posts?.length) {
    return (
      <ul className="divide-y rounded-2xl border bg-card" aria-hidden>
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
    <ul className="divide-y rounded-2xl border bg-card">
      {posts?.map((p) => (
        <li key={p.id}>
          <Link to={`/blog/${p.slug}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted">
            <span className={cn("w-20 shrink-0 font-hindi text-caption", TYPE_TEXT[p.post_type ?? "article"])}>{postTypeShort(p.post_type)}</span>
            <span className="line-clamp-2 min-w-0 flex-1 font-hindi text-small font-medium text-foreground">{p.title}</span>
            <span className="hidden shrink-0 text-caption font-normal text-muted-foreground sm:inline">{timeAgo(p.published_at)}</span>
            <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
