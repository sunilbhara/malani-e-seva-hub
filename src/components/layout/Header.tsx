import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { whatsappHref } from "@/lib/business";
import { formHelpMessage } from "@/lib/share";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { to: "/", label: "होम", end: true },
  { to: "/jobs", label: "नौकरियाँ" },
  { to: "/admit-card", label: "एडमिट कार्ड" },
  { to: "/result", label: "रिजल्ट" },
  { to: "/today", label: "आज की अपडेट" },
  { to: "/quiz", label: "GK क्विज़" },
  { to: "/services", label: "सेवाएँ" },
];

/** 56px header; hides on scroll down and returns on scroll up (Blueprint §8). */
export function Header() {
  const { user, role } = useAuth();
  const location = useLocation();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 120 && y > lastY.current);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setHidden(false), [location.pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85 transition-transform duration-200",
        hidden && "-translate-y-full",
      )}
    >
      <div className="container-page flex h-14 items-center gap-3 lg:h-16">
        <Logo className="mr-auto lg:mr-6" />

        <nav aria-label="मुख्य नेविगेशन" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 font-hindi text-small font-semibold transition-colors",
                  isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 lg:ml-auto">
          <Link to="/jobs?focus=search" aria-label="नौकरी खोजें" className="grid h-11 w-11 place-items-center rounded-full hover:bg-muted">
            <Search className="h-5 w-5" />
          </Link>
          <NotificationBell />
          {role === "admin" && (
            <Link to="/admin" aria-label="एडमिन डैशबोर्ड" className="hidden h-11 w-11 place-items-center rounded-full hover:bg-muted sm:grid">
              <LayoutDashboard className="h-5 w-5" />
            </Link>
          )}
          <Link
            to={user ? "/profile" : `/login?redirect=${encodeURIComponent(location.pathname)}`}
            aria-label={user ? "प्रोफ़ाइल" : "साइन इन"}
            className="hidden h-11 w-11 place-items-center rounded-full hover:bg-muted lg:grid"
          >
            <UserRound className="h-5 w-5" />
          </Link>
          <Button asChild variant="accent" className="ml-2 hidden font-hindi lg:inline-flex">
            <a
              href={whatsappHref(formHelpMessage())}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("form_help_click", { from: "header" })}
            >
              फॉर्म भरवाएँ
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
