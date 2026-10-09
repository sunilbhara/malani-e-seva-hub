import { Skeleton } from "@/components/common/Skeleton";

/**
 * Page-level loading state. Shows the shape of a page (title, text, cards) instead of a spinner,
 * so the layout does not jump when content arrives. The label is read by screen readers.
 */
export function PageSpinner({ label = "लोड हो रहा है…" }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" className="container-page min-h-[60vh] space-y-5 py-6">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-4/5 max-w-xl" />
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-11/12 max-w-2xl" />
        <Skeleton className="h-4 w-2/3 max-w-xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Post page placeholder: breadcrumb, status, title, facts card, action buttons and text. */
export function PostSkeleton() {
  return (
    <div role="status" aria-busy="true" className="container-page grid gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <span className="sr-only">पोस्ट लोड हो रही है…</span>
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid gap-2 sm:grid-cols-2">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
        <div className="space-y-2.5 pt-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className={i % 3 === 2 ? "h-4 w-2/3" : "h-4 w-full"} />
          ))}
        </div>
      </div>
      <div className="hidden space-y-3 lg:block">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-11 rounded-xl" />
      </div>
    </div>
  );
}

/** Rows placeholder for lists and tables. */
export function ListSkeleton({ rows = 4, className = "" }: { rows?: number; className?: string }) {
  return (
    <div role="status" aria-busy="true" className={`space-y-2 ${className}`}>
      <span className="sr-only">लोड हो रहा है…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-3">
          <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
