import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, MessageCircle, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
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
  { to: "/quiz", label: "GK क्विज़" },
  { to: "/services", label: "सेवाएँ" },
];

// Guests never see the bell, so its popover code is only downloaded after sign-in.
const NotificationBell = lazy(() => import("@/components/layout/NotificationBell").then((m) => ({ default: m.NotificationBell })));

const iconButton = "grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-white/10";

/** Ink header band; hides on scroll down and returns on scroll up (Blueprint §8). */
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

  const formHelp = (from: string) => ({
    href: whatsappHref(formHelpMessage()),
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: () => track("form_help_click", { from }),
  });

  return (
    <header
      className={cn(
        "jaali sticky top-0 z-40 bg-brand text-brand-foreground transition-transform duration-200",
        hidden && "-translate-y-full",
      )}
    >
      <div className="container-page flex h-14 items-center gap-2 lg:h-16">
        <Logo onDark className="mr-auto lg:mr-4" />

        <nav aria-label="मुख्य नेविगेशन" className="hidden items-center lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "relative whitespace-nowrap rounded-lg px-2.5 py-2 font-hindi text-small font-semibold transition-colors xl:px-3",
                  isActive
                    ? "text-brand-foreground after:absolute after:inset-x-2.5 after:-bottom-[0.6rem] after:h-[3px] after:rounded-full after:bg-accent"
                    : "text-brand-foreground/75 hover:text-brand-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 lg:ml-auto">
          <LanguageToggle />
          <Link to="/jobs?focus=search" aria-label="नौकरी खोजें" className={iconButton}>
            <Search className="h-5 w-5" />
          </Link>
          {user && (
            <Suspense fallback={<span aria-hidden className="h-11 w-11" />}>
              <NotificationBell />
            </Suspense>
          )}
          {role === "admin" && (
            <Link to="/admin" aria-label="एडमिन डैशबोर्ड" className={cn(iconButton, "hidden sm:grid")}>
              <LayoutDashboard className="h-5 w-5" />
            </Link>
          )}
          <Link
            to={user ? "/profile" : `/login?redirect=${encodeURIComponent(location.pathname)}`}
            aria-label={user ? "प्रोफ़ाइल" : "साइन इन"}
            className={cn(iconButton, "hidden lg:grid")}
          >
            <UserRound className="h-5 w-5" />
          </Link>
          {/* Phones: one-tap WhatsApp for form help. */}
          <a {...formHelp("header_mobile")} aria-label="फॉर्म भरवाने के लिए WhatsApp करें" className="ml-1 grid h-10 w-10 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground lg:hidden">
            <MessageCircle className="h-5 w-5" />
          </a>
          <Button asChild variant="accent" className="ml-2 hidden font-hindi lg:inline-flex">
            <a {...formHelp("header")}>फॉर्म भरवाएँ</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
