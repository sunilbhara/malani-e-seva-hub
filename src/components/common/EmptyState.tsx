import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Friendly empty state with one clear action (Blueprint §10.3). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  headingLevel,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Render the title as a heading when the empty state is the whole page (e.g. a missing post). */
  headingLevel?: 1 | 2;
}) {
  const Title = headingLevel ? (`h${headingLevel}` as const) : "p";
  return (
    <div className={cn("flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center", className)}>
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
        <Icon aria-hidden className="h-7 w-7" />
      </span>
      <Title className="font-hindi text-lg font-semibold text-foreground">{title}</Title>
      {description && <p className="mt-1.5 max-w-sm font-hindi text-small text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  id,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 id={id} className="flex items-center gap-2.5 font-hindi text-xl font-bold sm:text-2xl">
          <span aria-hidden className="h-5 w-1.5 shrink-0 rounded-full bg-accent" />
          {title}
        </h2>
        {description && <p className="mt-1 font-hindi text-small text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
