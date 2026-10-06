import { Link, useLocation } from "react-router-dom";
import { Bookmark, Briefcase, Home, Trophy, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

/** Mobile bottom navigation, 64px, thumb-reachable (Blueprint §8). */
export function BottomNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const items = [
    { to: "/", label: "होम", icon: Home, match: (p: string) => p === "/" },
    { to: "/jobs", label: "नौकरियाँ", icon: Briefcase, match: (p: string) => p.startsWith("/jobs") },
    { to: "/result", label: "रिजल्ट/एडमिट", icon: Trophy, match: (p: string) => p.startsWith("/result") || p.startsWith("/admit-card") },
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
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/90 lg:hidden"
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
                  "relative flex h-full flex-col items-center justify-center gap-0.5 font-hindi text-[0.6875rem] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-[1.375rem] w-[1.375rem]", active && "fill-primary/15")} aria-hidden />
                <span>{label}</span>
                {active && <span aria-hidden className="absolute top-1.5 h-1 w-1 translate-x-3 rounded-full bg-accent" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
