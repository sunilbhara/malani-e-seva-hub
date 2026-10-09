// AdSense loader (Phase 5). The verification meta tag is in index.html (vite.config.ts); the ~270 KB
// ad script is fetched only after the page has loaded and the browser is idle, or when an ad slot
// needs it — never in the admin area, never in development or E2E builds.
import { config } from "@/lib/config";
import { whenIdle } from "@/lib/analytics";

let requested = false;

export function loadAdsense(): void {
  const client = config.adsenseClient;
  if (requested || !client || import.meta.env.DEV || import.meta.env.MODE === "e2e") return;
  if (document.querySelector('script[src*="adsbygoogle.js"]')) {
    requested = true;
    return;
  }
  requested = true;
  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  document.head.appendChild(s);
}

/** Lets Auto ads run on reader pages without slowing down the first paint. */
export function initAdsense(): void {
  if (typeof window === "undefined" || location.pathname.startsWith("/admin")) return;
  whenIdle(loadAdsense, 6000);
}
