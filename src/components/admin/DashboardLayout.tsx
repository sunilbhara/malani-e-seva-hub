import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, FileText, Home, LayoutDashboard, LogOut, Menu, PanelLeftClose } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { hi } from "@/lib/blogHindi";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

const nav = [
  { to: "/admin", label: "Posts", icon: FileText },
  { to: "/blog", label: "View Blog", icon: BookOpen },
  { to: "/", label: "Main Site", icon: Home },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileNav, setMobileNav] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 text-gray-900">
      <aside
        className={cn(
          "custom-gradient-bg fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 text-white shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0",
          mobileNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white shadow-md">
                <img src="/logo.jpeg" alt="" className="h-full w-full object-contain p-0.5" />
              </div>
              <div>
                <div className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-sm font-bold text-transparent">
                  Malani CMS
                </div>
                <div className="font-hindi text-[11px] text-amber-100/90">ब्लॉग प्रबंधन</div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 lg:hidden"
              onClick={() => setMobileNav(false)}
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          </div>
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = to === "/admin" ? location.pathname.startsWith("/admin") : false;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 font-hindi text-sm font-medium transition-colors",
                    active ? "bg-white/15 text-white" : "text-amber-50/90 hover:bg-white/10 hover:text-white",
                  )}
                  onClick={() => setMobileNav(false)}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" />
                  {label}
                </Link>
              );
            })}
          </nav>
          {user?.email && (
            <div className="shrink-0 border-t border-white/10 p-3">
              <div className="truncate rounded-lg bg-black/20 px-3 py-2 text-xs text-amber-100/90">{user.email}</div>
            </div>
          )}
        </div>
      </aside>

      {mobileNav && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNav(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-amber-100/80 bg-white/90 px-4 shadow-sm backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="border-amber-200 lg:hidden" onClick={() => setMobileNav(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="hidden items-center gap-2 text-gray-600 sm:flex">
              <LayoutDashboard className="h-5 w-5 text-amber-700" />
              <span className="font-semibold text-gray-900">Admin Dashboard</span>
            </span>
          </div>
          <Button variant="outline" className="rounded-full border-amber-200 font-hindi shadow-sm" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
