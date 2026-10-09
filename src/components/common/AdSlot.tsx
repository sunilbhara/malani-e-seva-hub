import { useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";
import { loadAdsense } from "@/lib/adsense";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * One responsive AdSense unit. It takes no space until Google actually fills it
 * (data-ad-status="filled"), so unapproved or unfilled slots never leave an empty box.
 * Hidden when not configured, and in development.
 */
export function AdSlot({ className }: { className?: string }) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [filled, setFilled] = useState(false);
  const { adsenseClient, adsenseSlot } = config;
  const enabled = Boolean(adsenseClient && adsenseSlot) && !import.meta.env.DEV;

  useEffect(() => {
    if (!enabled || pushed.current) return;
    loadAdsense();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Ad blockers: the slot simply stays collapsed.
    }
  }, [enabled]);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof MutationObserver === "undefined") return;
    const check = () => setFilled(el.getAttribute("data-ad-status") === "filled");
    check();
    const observer = new MutationObserver(check);
    observer.observe(el, { attributes: true, attributeFilter: ["data-ad-status"] });
    return () => observer.disconnect();
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div className={cn("overflow-hidden", filled ? "rounded-xl" : "!m-0", className)} aria-label="विज्ञापन" aria-hidden={!filled}>
      {filled && <p className="mb-1 text-center text-caption font-normal uppercase tracking-wider text-muted-foreground">विज्ञापन</p>}
      <ins
        ref={ref}
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={adsenseClient!}
        data-ad-slot={adsenseSlot!}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
