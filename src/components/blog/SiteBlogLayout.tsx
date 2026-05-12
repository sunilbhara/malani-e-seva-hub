import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { blogPageBg } from "@/lib/blogBrand";
import { cn } from "@/lib/utils";

type SiteBlogLayoutProps = {
  children: React.ReactNode;
  /** Extra top padding below fixed nav (nav is h-20). */
  className?: string;
};

/**
 * Wraps blog-related routes with the same chrome as the marketing site:
 * shared `Navigation`, page background, and `Footer`.
 */
export function SiteBlogLayout({ children, className }: SiteBlogLayoutProps) {
  const location = useLocation();
  const isBlogRoute = location.pathname.startsWith("/blog");
  const isLoginRoute = location.pathname === "/login";
  const shouldMinimalFooter = isBlogRoute || isLoginRoute;

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className={cn(blogPageBg, "text-gray-900")}>
      <Navigation />
      <div className={cn("pt-24", className)}>{children}</div>
      <Footer minimal={shouldMinimalFooter} />
    </div>
  );
}
