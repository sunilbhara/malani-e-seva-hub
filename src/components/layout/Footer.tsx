import { Link } from "react-router-dom";
import { ChevronDown, Clock, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import type { ComponentType } from "react";
import { InstagramIcon, TelegramIcon, WhatsAppIcon, YouTubeIcon } from "@/components/common/BrandIcons";
import { BUSINESS, directionsHref, fullAddress, telHref, whatsappHref } from "@/lib/business";
import { config } from "@/lib/config";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { cn } from "@/lib/utils";

const LINKS = [
  {
    title: "नौकरी अपडेट",
    items: [
      { to: "/jobs", label: "सभी नौकरियाँ" },
      { to: "/admit-card", label: "एडमिट कार्ड" },
      { to: "/result", label: "रिजल्ट" },
      { to: "/today", label: "आज की अपडेट" },
      { to: "/quiz", label: "डेली GK क्विज़" },
    ],
  },
  {
    title: "हमारी दुकान",
    items: [
      { to: "/services", label: "ई-मित्र सेवाएँ" },
      { to: "/mobile-electronics", label: "मोबाइल और इलेक्ट्रॉनिक्स" },
      { to: "/mataji-studio", label: "माताजी स्टूडियो" },
      { to: "/about", label: "हमारे बारे में" },
      { to: "/contact", label: "संपर्क करें" },
    ],
  },
  {
    title: "जानकारी",
    items: [
      { to: "/blog", label: "सभी अपडेट" },
      { to: "/privacy-policy", label: "प्राइवेसी पॉलिसी" },
      { to: "/terms", label: "नियम और शर्तें" },
      { to: "/disclaimer", label: "अस्वीकरण" },
    ],
  },
];

interface Social {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

function socials(): Social[] {
  const list: Array<Social | null> = [
    { href: BUSINESS.social.instagram, label: "Instagram", icon: InstagramIcon },
    { href: BUSINESS.social.youtube, label: "YouTube", icon: YouTubeIcon },
    config.whatsappChannelUrl ? { href: config.whatsappChannelUrl, label: "WhatsApp चैनल", icon: WhatsAppIcon } : null,
    config.telegramChannelUrl ? { href: config.telegramChannelUrl, label: "Telegram", icon: TelegramIcon } : null,
  ];
  return list.filter((s): s is Social => s !== null);
}

const action = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 font-hindi text-small font-semibold";

/** Ink footer: compact on phones (contact actions, social, collapsible links), four columns on desktop. */
export function Footer({ compact = false }: { compact?: boolean }) {
  const year = new Date().getFullYear();
  const bottom = (
    <div className="container-page flex flex-col gap-3 py-5 text-caption font-normal text-brand-foreground/70 md:flex-row md:items-center md:justify-between">
      <p className="max-w-2xl font-hindi leading-relaxed">
        अस्वीकरण: हम सरकारी संस्था नहीं हैं। अंतिम और सही जानकारी के लिए हमेशा आधिकारिक वेबसाइट और अधिसूचना देखें।
      </p>
      <div className="flex items-center justify-between gap-4 md:justify-end">
        <span>© {year} {BUSINESS.name}</span>
        <ThemeToggle />
      </div>
    </div>
  );

  if (compact) {
    return <footer className="mt-12 bg-brand text-brand-foreground">{bottom}</footer>;
  }

  return (
    <footer className="jaali mt-16 bg-brand pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] text-brand-foreground lg:pb-0">
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:py-12">
        <div className="space-y-4">
          <div>
            <p className="font-hindi text-lg font-bold">{BUSINESS.nameHi}</p>
            <p className="font-hindi text-small text-brand-foreground/75">ई-मित्र · मोबाइल और इलेक्ट्रॉनिक्स · माताजी स्टूडियो, बाड़मेर</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href={whatsappHref("नमस्ते, मुझे जानकारी चाहिए।")} target="_blank" rel="noopener noreferrer" className={cn(action, "bg-whatsapp text-whatsapp-foreground")}>
              <MessageCircle aria-hidden className="h-4 w-4" /> WhatsApp
            </a>
            <a href={telHref} className={cn(action, "bg-accent text-accent-foreground")}>
              <Phone aria-hidden className="h-4 w-4" /> कॉल करें
            </a>
            <a href={directionsHref} target="_blank" rel="noopener noreferrer" className={cn(action, "border border-brand-foreground/30 text-brand-foreground hover:bg-white/10")}>
              <Navigation aria-hidden className="h-4 w-4" /> रास्ता
            </a>
          </div>

          <ul className="space-y-2 font-hindi text-small text-brand-foreground/80">
            <li className="flex gap-2.5">
              <MapPin aria-hidden className="mt-1 h-4 w-4 shrink-0 text-accent" />
              <span>{fullAddress("hi")}</span>
            </li>
            <li className="flex gap-2.5">
              <Clock aria-hidden className="mt-1 h-4 w-4 shrink-0 text-accent" />
              <span>{BUSINESS.hoursTextHi}</span>
            </li>
          </ul>

          <ul className="flex flex-wrap gap-2.5" aria-label="सोशल मीडिया">
            {socials().map(({ href, label, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex min-h-11 items-center gap-2.5 rounded-xl py-1 pl-1 pr-3 font-hindi text-small font-semibold text-brand-foreground/90 transition-colors hover:bg-white/10 hover:text-brand-foreground"
                >
                  <Icon className="h-10 w-10 shrink-0 drop-shadow-sm" />
                  <span aria-hidden>{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Phones: collapsible groups keep the footer short. */}
        <div className="divide-y divide-brand-foreground/15 border-y border-brand-foreground/15 lg:hidden">
          {LINKS.map((group) => (
            <details key={group.title} className="group">
              <summary className="flex h-12 cursor-pointer list-none items-center justify-between font-hindi font-semibold [&::-webkit-details-marker]:hidden">
                {group.title}
                <ChevronDown aria-hidden className="h-5 w-5 transition-transform group-open:rotate-180" />
              </summary>
              <ul className="grid grid-cols-2 pb-3">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="flex min-h-11 items-center font-hindi text-small text-brand-foreground/80 hover:text-brand-foreground">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        {LINKS.map((group) => (
          <nav key={group.title} aria-label={group.title} className="hidden lg:block">
            <p className="mb-2 font-hindi font-semibold">{group.title}</p>
            <ul>
              {group.items.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="flex min-h-10 items-center font-hindi text-small text-brand-foreground/75 hover:text-brand-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-brand-foreground/15">{bottom}</div>
    </footer>
  );
}
