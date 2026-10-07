import { Suspense, lazy, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { PageSpinner } from "@/components/common/PageSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { trackPageView } from "@/lib/analytics";
import { readJson, writeJson } from "@/lib/storage";
import { shouldAskPreferences } from "@/lib/preferences";

const PreferenceSheet = lazy(() => import("@/components/engagement/PreferenceSheet"));

/** Layout for every public page: header, content, footer and the mobile bottom nav. */
export function AppShell() {
  const location = useLocation();
  const [askPrefs, setAskPrefs] = useState(false);
  // Post pages show their own contextual action bar instead of the bottom nav (Blueprint §8).
  const onPost = /^\/blog\/[^/]+\/?$/.test(location.pathname);

  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0 });
    // Wait for Helmet to set the page title before reporting the view.
    const id = window.setTimeout(() => trackPageView(location.pathname + location.search, document.title), 50);

    const views = readJson<number>("malani-page-views", 0) + 1;
    writeJson("malani-page-views", views);
    if (shouldAskPreferences(views) && !location.pathname.startsWith("/login")) setAskPrefs(true);
    return () => window.clearTimeout(id);
  }, [location.pathname, location.search, location.hash]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        मुख्य सामग्री पर जाएँ
      </a>
      <Header />
      <main id="main" className="flex-1 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] lg:pb-0">
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      {!onPost && <BottomNav />}
      {askPrefs && (
        <Suspense fallback={null}>
          <PreferenceSheet open={askPrefs} onOpenChange={setAskPrefs} />
        </Suspense>
      )}
    </div>
  );
}
