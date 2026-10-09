import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/** `onDark` renders the name in ivory for the ink header band. */
export function Logo({ className, compact = false, onDark = false }: { className?: string; compact?: boolean; onDark?: boolean }) {
  return (
    <Link to="/" className={cn("flex min-w-0 items-center gap-2.5 rounded-xl", className)} aria-label="मालाणी बाड़मेर — होम">
      <img src="/logo-80.webp" srcSet="/logo-80.webp 1x, /logo-160.webp 2x" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-0.5" />
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className={cn("block truncate font-hindi text-[1.0625rem] font-bold", onDark ? "text-brand-foreground" : "text-foreground")}>मालाणी बाड़मेर</span>
          {/* Full tagline only where it fits; phones get a short one instead of a cut-off line. */}
          <span className={cn("block truncate text-caption font-normal", onDark ? "text-brand-foreground/75" : "text-muted-foreground")}>
            <span className="sm:hidden">नौकरी · ई-मित्र</span>
            <span className="hidden sm:inline">नौकरी अपडेट · ई-मित्र सेवाएँ</span>
          </span>
        </span>
      )}
    </Link>
  );
}
