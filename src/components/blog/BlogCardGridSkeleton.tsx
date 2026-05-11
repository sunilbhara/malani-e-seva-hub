import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export function BlogCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonTheme baseColor="hsl(var(--muted))" highlightColor="hsl(var(--muted-foreground) / 0.12)">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-sm"
          >
            <Skeleton className="!block h-48 w-full" borderRadius={0} />
            <div className="space-y-3 p-5">
              <Skeleton height={14} width="40%" />
              <Skeleton height={22} count={2} />
              <Skeleton height={14} count={2} />
              <div className="flex gap-4 pt-2">
                <Skeleton height={14} width={60} />
                <Skeleton height={14} width={60} />
                <Skeleton height={14} width={60} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SkeletonTheme>
  );
}
