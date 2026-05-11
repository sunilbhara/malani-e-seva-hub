import { cn } from "@/lib/utils";

/** Page shell matching the marketing site (`Index`): soft gradient background. */
export const blogPageBg = "min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50";

/** Primary CTA — warm gradient aligned with `Navigation` logo / `Hero` accents. */
export const brandCtaClass =
  "rounded-full bg-gradient-to-r from-[#ef4444] via-[#b45309] to-[#f59e0b] text-white shadow-lg shadow-orange-500/25 hover:opacity-[0.96] transition-opacity";

/** Secondary pill / outline in brand yellow–amber. */
export const brandAccentText = "text-amber-700 dark:text-amber-500";
export const brandBorder = "border-amber-200/80";

export function brandHeadingClass(className?: string) {
  return cn(
    "bg-gradient-to-r from-[#ef4444] via-[#b45309] to-[#f59e0b] bg-clip-text text-transparent",
    className,
  );
}

export function glassCardClass(className?: string) {
  return cn(
    "rounded-2xl border border-white/60 bg-white/80 shadow-xl shadow-black/[0.06] backdrop-blur-md dark:border-white/10 dark:bg-white/5",
    className,
  );
}
