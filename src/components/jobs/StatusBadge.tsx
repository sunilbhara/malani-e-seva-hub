import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { countdownLabel, STATUS_LABEL, statusClasses, type JobStatus } from "@/lib/jobs";
import { daysUntil } from "@/lib/format";

/** Status pill with a dot so colour is never the only signal (Blueprint §10.3). */
export function StatusBadge({ status, daysLeft, className }: { status: JobStatus | null; daysLeft?: number | null; className?: string }) {
  if (!status) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-hindi", statusClasses(status, daysLeft), className)}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** "⏰ 20 दिन बचे" chip coloured by urgency. */
export function CountdownChip({ lastDate, status, className }: { lastDate: string | null | undefined; status: JobStatus | null; className?: string }) {
  if (!lastDate || !status) return null;
  const left = daysUntil(lastDate);
  const label = countdownLabel(lastDate);
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-caption font-hindi tabular", statusClasses(status, left), className)}
      aria-label={status === "closed" ? "आवेदन बंद हो चुका है" : `अंतिम तिथि में ${label}`}
    >
      <Clock3 aria-hidden className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
