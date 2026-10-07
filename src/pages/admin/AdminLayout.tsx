import { Suspense } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { Brain, FileText, LayoutDashboard, MessageSquareWarning, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import { PageSpinner } from "@/components/common/PageSpinner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/admin", label: "डैशबोर्ड", icon: LayoutDashboard, end: true },
  { to: "/admin/posts", label: "पोस्ट", icon: FileText },
  { to: "/admin/posts/new", label: "नई पोस्ट", icon: PenSquare },
  { to: "/admin/moderation", label: "सवाल", icon: MessageSquareWarning },
  { to: "/admin/quiz", label: "क्विज़", icon: Brain },
];

/** Admin area. The UI check is convenience only — every write is enforced by RLS in the database. */
export default function AdminLayout() {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (role !== "admin") {
    return (
      <div className="container-page py-16 text-center">
        <SEO title="एडमिन" description="एडमिन" path="/admin" noindex />
        <p className="font-hindi text-lg font-semibold">इस पेज के लिए एडमिन अनुमति चाहिए।</p>
        <Button asChild variant="outline" className="mt-4 font-hindi"><Link to="/">होम पर जाएँ</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-page py-6">
      <SEO title="एडमिन डैशबोर्ड | मालाणी बाड़मेर" description="एडमिन" path={location.pathname} noindex />
      <nav aria-label="एडमिन" className="-mx-4 mb-6 overflow-x-auto px-4 scrollbar-none">
        <ul className="flex gap-1 rounded-xl border bg-card p-1">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="shrink-0">
              <NavLink
                to={to}
                end={end ?? to === "/admin/posts"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-2 font-hindi text-small font-semibold",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                <Icon aria-hidden className="h-4 w-4" /> {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Suspense fallback={<PageSpinner />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
