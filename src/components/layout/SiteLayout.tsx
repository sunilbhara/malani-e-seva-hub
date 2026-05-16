import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

type SiteLayoutProps = {
  children: React.ReactNode;
  className?: string;
  minimalFooter?: boolean;
};

export function SiteLayout({ children, className, minimalFooter = false }: SiteLayoutProps) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 text-gray-900">
      <Navigation />
      <div className={cn("pt-24", className)}>{children}</div>
      <Footer minimal={minimalFooter} />
    </div>
  );
}
