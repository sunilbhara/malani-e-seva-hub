import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import { whatsappHref } from "@/lib/business";
import { formHelpMessage } from "@/lib/share";
import { track } from "@/lib/analytics";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

const SHOP_TILES = [
  { to: "/services", key: "emitra", short: "ई-मित्र", title: "ई-मित्र सेवाएँ", text: "फॉर्म, प्रमाण पत्र, आधार-पैन, बिल", alt: "मालाणी ई-मित्र केंद्र का काउंटर और कंप्यूटर" },
  { to: "/mobile-electronics", key: "mobile", short: "मोबाइल", title: "मोबाइल और एक्सेसरीज़", text: "नए फ़ोन, ईयरफ़ोन, चार्जर, स्पीकर", alt: "मालाणी मोबाइल शोरूम में एक्सेसरीज़ से भरी अलमारियाँ" },
  { to: "/mataji-studio", key: "studio", short: "स्टूडियो", title: "माताजी स्टूडियो", text: "शादी, प्री-वेडिंग, पासपोर्ट फोटो", alt: "माताजी स्टूडियो की शादी की फोटो" },
] as const;
type Tile = (typeof SHOP_TILES)[number];

const AUTOPLAY_MS = 4500;
const SWIPE_PX = 40;

function TileImage({ t, sizes }: { t: Tile; sizes: string }) {
  return (
    <img
      src={`/shop/${t.key}-480.webp`}
      srcSet={`/shop/${t.key}-480.webp 480w, /shop/${t.key}-800.webp 800w`}
      sizes={sizes}
      alt={t.alt}
      width={480}
      height={360}
      loading="lazy"
      decoding="async"
      draggable={false}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
    />
  );
}

function TileCard({ t, sizes, hidden = false }: { t: Tile; sizes: string; hidden?: boolean }) {
  return (
    <Link
      to={t.to}
      tabIndex={hidden ? -1 : undefined}
      className="group block select-none overflow-hidden rounded-xl border bg-card shadow-1 transition-shadow hover:shadow-2"
    >
      <span className="block aspect-[4/3] overflow-hidden bg-muted">
        <TileImage t={t} sizes={sizes} />
      </span>
      <span className="flex items-center justify-between gap-2 p-3.5">
        <span className="min-w-0">
          <span className="block font-hindi font-bold text-foreground">{t.title}</span>
          <span className="block truncate font-hindi text-small text-muted-foreground">{t.text}</span>
        </span>
        <ArrowRight aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/**
 * Phones: an endless, auto-advancing slider with one large slide and the neighbours peeking in.
 * Readers can swipe it or pick a business from the tabs above, which show the autoplay progress.
 * Autoplay pauses while touched or focused, off-screen, or when the phone asks for reduced motion.
 */
function ShopSlider({ tiles }: { tiles: readonly Tile[] }) {
  const n = tiles.length;
  // Track = [last clone, ...tiles, first clone]; position 1..n are the real slides.
  const slides = [tiles[n - 1], ...tiles, tiles[0]];
  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);
  const [drag, setDrag] = useState(0);
  const [holding, setHolding] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const rootRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const active = (((pos - 1) % n) + n) % n;
  const playing = !holding && !focused && onScreen && !reducedMotion && n > 1;

  const go = useCallback((next: number) => {
    setAnimate(true);
    setPos(next);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => go(pos + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [playing, pos, go]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // After a jump without animation (clone -> real slide), turn the transition back on next frame.
  useEffect(() => {
    if (animate) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  function onTransitionEnd() {
    if (pos === 0 || pos === n + 1) {
      setAnimate(false);
      setPos(pos === 0 ? n : 1);
    }
  }

  function onTouchStart(e: TouchEvent) {
    touchX.current = e.touches[0].clientX;
    setHolding(true);
  }
  function onTouchMove(e: TouchEvent) {
    if (touchX.current === null) return;
    setDrag(e.touches[0].clientX - touchX.current);
  }
  function onTouchEnd() {
    if (Math.abs(drag) > SWIPE_PX) go(pos + (drag < 0 ? 1 : -1));
    touchX.current = null;
    setDrag(0);
    setHolding(false);
  }

  function pick(i: number) {
    track("shop_slider_pick", { business: tiles[i].key });
    go(i + 1);
  }

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="दुकान की सेवाएँ"
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
    >
      <div role="tablist" aria-label="सेवा चुनें" className="mb-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {tiles.map((t, i) => {
          const selected = i === active;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`shop-slide-${t.key}`}
              onClick={() => pick(i)}
              className={cn(
                "relative h-10 overflow-hidden rounded-full border font-hindi text-small font-semibold transition-colors",
                selected ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground",
              )}
            >
              {selected && n > 1 && !reducedMotion && (
                <span
                  key={pos}
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-accent motion-safe:animate-shop-progress"
                  style={{ animationDuration: `${AUTOPLAY_MS}ms`, animationPlayState: playing ? "running" : "paused" }}
                />
              )}
              <span className="relative">{t.short}</span>
            </button>
          );
        })}
      </div>

      <div className="-mx-4 overflow-clip" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
        <div
          className={cn("flex gap-3 will-change-transform", animate && drag === 0 && "transition-transform duration-500 ease-out")}
          style={{ transform: `translateX(calc(${-pos} * (86% + 0.75rem) + 7% + ${drag}px))` }}
          onTransitionEnd={(e) => e.target === e.currentTarget && onTransitionEnd()}
        >
          {slides.map((t, i) => {
            const clone = i === 0 || i === n + 1;
            const current = i === pos;
            return (
              <div
                key={`${t.key}-${i}`}
                id={clone ? undefined : `shop-slide-${t.key}`}
                role={clone ? undefined : "tabpanel"}
                aria-roledescription={clone ? undefined : "slide"}
                aria-label={clone ? undefined : `${i} / ${n}`}
                aria-hidden={clone ? true : undefined}
                onFocus={clone ? undefined : () => i !== pos && go(i)}
                className={cn("w-[86%] shrink-0 transition-[opacity,transform] duration-500", !current && "scale-[0.96]")}
              >
                <TileCard t={t} sizes="86vw" hidden={clone} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * "हमारी दुकान": real photos of the shop's three businesses. Auto slider on phones,
 * three columns on larger screens. `current` hides the tile for the page you are on.
 */
export function ShopStrip({ current, showHelp = true, className }: { current?: string; showHelp?: boolean; className?: string }) {
  const tiles = SHOP_TILES.filter((t) => t.to !== current);
  const wide = useMediaQuery("(min-width: 640px)");
  return (
    <section aria-labelledby="shop-strip" className={className}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="shop-strip" className="flex items-center gap-2.5 font-hindi text-xl font-bold sm:text-2xl">
          <span aria-hidden className="h-5 w-1.5 shrink-0 rounded-full bg-accent" />
          {current ? "हमारी दूसरी सेवाएँ" : "हमारी दुकान — बाड़मेर"}
        </h2>
      </div>
      {wide || tiles.length < 3 ? (
        <ul className={cn("grid gap-3", tiles.length < 3 ? "grid-cols-1 min-[480px]:grid-cols-2" : "grid-cols-3")}>
          {tiles.map((t) => (
            <li key={t.key} className="min-w-0">
              <TileCard t={t} sizes={wide ? "33vw" : "100vw"} />
            </li>
          ))}
        </ul>
      ) : (
        <ShopSlider tiles={tiles} />
      )}
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
