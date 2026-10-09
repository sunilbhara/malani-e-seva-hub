import { Link, useLocation } from "react-router-dom";
import { Bookmark, Briefcase, Home, Store, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const JOB_PATHS = ["/jobs", "/admit-card", "/result", "/today", "/blog"];
const SHOP_PATHS = ["/services", "/mobile-electronics", "/mataji-studio"];

/** Mobile bottom navigation, 64px, thumb-reachable (Blueprint §8). */
export function BottomNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const items = [
    { to: "/", label: "होम", icon: Home, match: (p: string) => p === "/" },
    { to: "/jobs", label: "नौकरियाँ", icon: Briefcase, match: (p: string) => JOB_PATHS.some((j) => p.startsWith(j)) },
    { to: "/services", label: "सेवाएँ", icon: Store, match: (p: string) => SHOP_PATHS.some((s) => p.startsWith(s)) },
    { to: "/my", label: "सेव", icon: Bookmark, match: (p: string) => p.startsWith("/my") },
    {
      to: user ? "/profile" : "/login",
      label: user ? "प्रोफ़ाइल" : "लॉगिन",
      icon: UserRound,
      match: (p: string) => p.startsWith("/profile") || p.startsWith("/login"),
    },
  ];

  return (
    <nav
      aria-label="नीचे का नेविगेशन"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid h-bottom-nav max-w-xl grid-cols-5">
        {items.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={label}>
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-1 font-hindi text-[0.8125rem] font-semibold leading-none transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {active && <span aria-hidden className="absolute top-0 h-[3px] w-10 rounded-b-full bg-accent" />}
                <Icon className="h-[1.375rem] w-[1.375rem]" strokeWidth={active ? 2.4 : 1.9} aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
