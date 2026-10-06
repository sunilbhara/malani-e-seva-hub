import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn("flex min-w-0 items-center gap-2.5 rounded-xl", className)} aria-label="मालाणी बाड़मेर — होम">
      <img src="/logo.jpeg" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl border bg-white object-contain p-0.5" />
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-hindi text-[1.0625rem] font-bold text-foreground">मालाणी बाड़मेर</span>
          <span className="block truncate text-caption font-normal text-muted-foreground">नौकरी अपडेट · ई-मित्र सेवाएँ</span>
        </span>
      )}
    </Link>
  );
}
