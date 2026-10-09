import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { PageSpinner } from "@/components/common/PageSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { trackPageView } from "@/lib/analytics";
import { readJson, writeJson } from "@/lib/storage";
import { useEnglishMode } from "@/components/layout/LanguageToggle";

/**
 * Layout for every public page: header, content, footer and the mobile bottom nav.
 * Reader preferences are offered inline (home and job lists), never as a popup over the page.
 */
export function AppShell() {
  const location = useLocation();
  // Post pages show their own contextual action bar; admin has its own bars.
  const onPost = /^\/blog\/[^/]+\/?$/.test(location.pathname);
  const onAdmin = location.pathname.startsWith("/admin");
  useEnglishMode();

  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0 });
    // Wait for Helmet to set the page title before reporting the view.
    const id = window.setTimeout(() => trackPageView(location.pathname + location.search, document.title), 50);
    writeJson("malani-page-views", readJson<number>("malani-page-views", 0) + 1);
    return () => window.clearTimeout(id);
  }, [location.pathname, location.search, location.hash]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        मुख्य सामग्री पर जाएँ
      </a>
      <Header />
      <main id="main" className="flex-1">
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer compact={onAdmin} />
      {!onPost && !onAdmin && <BottomNav />}
    </div>
  );
}
