import { Link } from "react-router-dom";
import { Clock, Instagram, MapPin, Phone, Youtube } from "lucide-react";
import { BUSINESS, directionsHref, fullAddress, telHref } from "@/lib/business";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
    title: "हमारी सेवाएँ",
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
      { to: "/privacy-policy", label: "प्राइवेसी पॉलिसी" },
      { to: "/terms", label: "नियम और शर्तें" },
      { to: "/disclaimer", label: "अस्वीकरण" },
      { to: "/blog", label: "सभी लेख" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <p className="font-hindi text-lg font-bold">{BUSINESS.nameHi}</p>
          <ul className="space-y-3 font-hindi text-small text-muted-foreground">
            <li className="flex gap-2.5">
              <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                {fullAddress("hi")}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Phone aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <a href={telHref} className="tabular hover:text-foreground">{BUSINESS.phone}</a>
            </li>
            <li className="flex gap-2.5">
              <Clock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{BUSINESS.hoursTextHi}</span>
            </li>
          </ul>
          <div className="flex gap-2">
            <a href={BUSINESS.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full border hover:bg-muted">
              <Instagram className="h-4 w-4" />
            </a>
            <a href={BUSINESS.social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="grid h-10 w-10 place-items-center rounded-full border hover:bg-muted">
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>

        {LINKS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="mb-3 font-hindi text-small font-semibold text-foreground">{group.title}</p>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="font-hindi text-small text-muted-foreground hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t">
        <div className="container-page flex flex-col gap-4 py-6 text-caption font-normal text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl font-hindi leading-relaxed">
            अस्वीकरण: हम सरकारी संस्था नहीं हैं। भर्ती की अंतिम और सही जानकारी के लिए हमेशा आधिकारिक वेबसाइट और अधिसूचना देखें।
          </p>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <p className="container-page pb-24 text-caption font-normal text-muted-foreground lg:pb-6">
          © {new Date().getFullYear()} {BUSINESS.name}
        </p>
      </div>
    </footer>
  );
}
