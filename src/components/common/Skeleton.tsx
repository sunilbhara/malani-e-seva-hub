import { cn } from "@/lib/utils";

/** Placeholder block shown while content loads (pulses, respects reduced motion via index.css). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

/** Screen-reader text for a loading region, so skeletons are not silent. */
export function LoadingLabel({ text = "लोड हो रहा है…" }: { text?: string }) {
  return (
    <span role="status" className="sr-only">
      {text}
    </span>
  );
}
