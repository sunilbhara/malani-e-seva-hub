import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import { whatsappHref } from "@/lib/business";
import { formHelpMessage } from "@/lib/share";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const SHOP_TILES = [
  { to: "/services", key: "emitra", title: "ई-मित्र सेवाएँ", text: "फॉर्म, प्रमाण पत्र, आधार-पैन, बिल", alt: "मालाणी ई-मित्र केंद्र का काउंटर और कंप्यूटर" },
  { to: "/mobile-electronics", key: "mobile", title: "मोबाइल और एक्सेसरीज़", text: "नए फ़ोन, ईयरफ़ोन, चार्जर, स्पीकर", alt: "मालाणी मोबाइल शोरूम में एक्सेसरीज़ से भरी अलमारियाँ" },
  { to: "/mataji-studio", key: "studio", title: "माताजी स्टूडियो", text: "शादी, प्री-वेडिंग, पासपोर्ट फोटो", alt: "माताजी स्टूडियो की शादी की फोटो" },
] as const;

/**
 * "हमारी दुकान": real photos of the shop's three businesses. Swipeable row on phones,
 * three columns on larger screens. `current` hides the tile for the page you are on.
 */
export function ShopStrip({ current, showHelp = true, className }: { current?: string; showHelp?: boolean; className?: string }) {
  const tiles = SHOP_TILES.filter((t) => t.to !== current);
  return (
    <section aria-labelledby="shop-strip" className={className}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="shop-strip" className="flex items-center gap-2.5 font-hindi text-xl font-bold sm:text-2xl">
          <span aria-hidden className="h-5 w-1.5 shrink-0 rounded-full bg-accent" />
          {current ? "हमारी दूसरी सेवाएँ" : "हमारी दुकान — बाड़मेर"}
        </h2>
      </div>
      <ul className="rail-fade -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:[mask-image:none]">
        {tiles.map((t) => (
          <li key={t.key} className={cn("w-[72%] shrink-0 snap-start sm:w-auto", tiles.length === 2 && "sm:col-span-1")}>
            <Link to={t.to} className="group block overflow-hidden rounded-xl border bg-card shadow-1 transition-shadow hover:shadow-2">
              <span className="block aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={`/shop/${t.key}-480.webp`}
                  srcSet={`/shop/${t.key}-480.webp 480w, /shop/${t.key}-800.webp 800w`}
                  sizes="(min-width: 640px) 33vw, 72vw"
                  alt={t.alt}
                  width={480}
                  height={360}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </span>
              <span className="flex items-center justify-between gap-2 p-3.5">
                <span className="min-w-0">
                  <span className="block font-hindi font-bold text-foreground">{t.title}</span>
                  <span className="block truncate font-hindi text-small text-muted-foreground">{t.text}</span>
                </span>
                <ArrowRight aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {showHelp && (
        <a
          href={whatsappHref(formHelpMessage())}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("form_help_click", { from: "shop_strip" })}
          className="mt-3 flex min-h-12 items-center gap-3 rounded-xl bg-accent-soft px-4 py-2.5 font-hindi text-small text-foreground ring-1 ring-accent/40 transition-colors hover:bg-accent/20"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground">
            <MessageCircle aria-hidden className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <strong className="font-semibold">फॉर्म भरने में परेशानी?</strong> दस्तावेज़ WhatsApp करें — हम भर देंगे।
          </span>
          <ArrowRight aria-hidden className="h-4 w-4 shrink-0" />
        </a>
      )}
    </section>
  );
}
