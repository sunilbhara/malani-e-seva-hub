import { useEffect, useRef } from "react";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let scriptRequested = false;

function loadAdsense(client: string) {
  if (scriptRequested || document.querySelector('script[src*="adsbygoogle.js"]')) return;
  scriptRequested = true;
  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  document.head.appendChild(s);
}

/** One responsive AdSense unit with reserved height (no layout shift). Hidden when not configured. */
export function AdSlot({ className }: { className?: string }) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const { adsenseClient, adsenseSlot } = config;

  useEffect(() => {
    if (!adsenseClient || !adsenseSlot || pushed.current || import.meta.env.DEV) return;
    loadAdsense(adsenseClient);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Ad blockers: leave the reserved space empty.
    }
  }, [adsenseClient, adsenseSlot]);

  if (!adsenseClient || !adsenseSlot) return null;
  return (
    <div className={cn("min-h-[280px] overflow-hidden rounded-2xl", className)} aria-label="विज्ञापन">
      <p className="mb-1 text-center text-[0.6875rem] font-normal uppercase tracking-wider text-muted-foreground">विज्ञापन</p>
      <ins
        ref={ref}
        className="adsbygoogle block"
        style={{ display: "block", minHeight: 250 }}
        data-ad-client={adsenseClient}
        data-ad-slot={adsenseSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
