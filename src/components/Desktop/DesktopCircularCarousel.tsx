import {
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const cn = (...classes: (string | undefined | false | null)[]) =>
  classes.filter(Boolean).join(" ");

export interface CircularCarouselItem {
  id: string | number;
  image?: string;
  title: string;
  subtitle?: string;
  description?: string;
}

interface DesktopCircularCarouselProps<T extends CircularCarouselItem>
  extends HTMLAttributes<HTMLDivElement> {
  items: T[];
  renderItem?: (item: T, meta: { active: boolean; index: number }) => ReactNode;
  renderOverlay?: (item: T) => ReactNode;
  autoRotate?: boolean;
  autoRotateDelay?: number;
  radiusX?: number;
  radiusY?: number;
  cardWidth?: number;
  cardHeight?: number;
  showButtons?: boolean;
  pauseOnHover?: boolean;
  className?: string;
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function shortestOffset(index: number, activeIndex: number, length: number) {
  const raw = index - activeIndex;
  if (raw > length / 2) return raw - length;
  if (raw < -length / 2) return raw + length;
  return raw;
}

export function DesktopCircularCarousel<T extends CircularCarouselItem>({
  items,
  renderItem,
  renderOverlay,
  autoRotate = true,
  autoRotateDelay = 3600,
  radiusX = 360,
  radiusY = 86,
  cardWidth = 320,
  cardHeight = 420,
  showButtons = true,
  pauseOnHover = true,
  className,
  ...props
}: DesktopCircularCarouselProps<T>) {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const length = items.length;

  const canAnimate = length > 1 && !prefersReducedMotion;
  const isPaused = paused || (pauseOnHover && hovered);

  useEffect(() => {
    if (!autoRotate || !canAnimate || isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => wrapIndex(current + 1, length));
    }, autoRotateDelay);
    return () => window.clearInterval(timer);
  }, [autoRotate, autoRotateDelay, canAnimate, isPaused, length]);

  const goTo = (index: number) => setActiveIndex(wrapIndex(index, length));
  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  const visibleItems = useMemo(
    () =>
      items.map((item, index) => {
        const offset = shortestOffset(index, activeIndex, length);
        const abs = Math.abs(offset);
        const angle = offset * 38;
        const x = Math.sin((angle * Math.PI) / 180) * radiusX;
        const y = abs === 0 ? 0 : radiusY + abs * 12;
        const scale = Math.max(0.58, 1 - abs * 0.13);
        const opacity = abs > 3 ? 0 : Math.max(0.18, 1 - abs * 0.2);
        const zIndex = 20 - abs;
        const rotateY = offset * -16;

        return { item, index, offset, abs, x, y, scale, opacity, zIndex, rotateY };
      }),
    [activeIndex, items, length, radiusX, radiusY],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  };

  if (length === 0) return null;

  return (
    <div
      className={cn("relative hidden min-h-[560px] w-full overflow-hidden lg:block", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Services carousel"
      {...props}
    >
      <div className="pointer-events-none absolute inset-x-16 top-1/2 h-40 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-200/20 via-amber-200/30 to-purple-200/20 blur-3xl" />

      <div className="relative mx-auto h-[520px] max-w-6xl" style={{ perspective: "1600px" }}>
        {visibleItems.map(({ item, index, abs, x, y, scale, opacity, zIndex, rotateY }) => {
          const active = index === activeIndex;
          const inert = abs > 2;

          return (
            <motion.article
              key={item.id}
              aria-hidden={!active}
              className={cn(
                "absolute left-1/2 top-1/2 origin-center outline-none",
                inert && "pointer-events-none",
              )}
              style={{
                width: cardWidth,
                height: cardHeight,
                marginLeft: -cardWidth / 2,
                marginTop: -cardHeight / 2,
                zIndex,
                transformStyle: "preserve-3d",
              }}
              initial={false}
              animate={{
                x,
                y,
                scale,
                opacity,
                rotateY,
                filter: active ? "blur(0px)" : abs > 2 ? "blur(1px)" : "blur(0px)",
              }}
              transition={{ type: "spring", stiffness: 120, damping: 22, mass: 0.8 }}
              onClick={() => !active && goTo(index)}
            >
              {renderItem ? (
                renderItem(item, { active, index })
              ) : (
                <div className="group relative h-full w-full overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-2xl shadow-slate-900/15 backdrop-blur-xl">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      draggable={false}
                      loading={active ? "eager" : "lazy"}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-white to-amber-100" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                    {renderOverlay ? (
                      renderOverlay(item)
                    ) : (
                      <>
                        <h3 className="text-2xl font-bold tracking-tight">{item.title}</h3>
                        {item.subtitle && <p className="mt-1 text-sm text-white/75">{item.subtitle}</p>}
                        {item.description && <p className="mt-3 line-clamp-3 text-sm text-white/75">{item.description}</p>}
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.article>
          );
        })}
      </div>

      {showButtons && length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 top-1/2 z-40 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-800 shadow-lg backdrop-blur transition hover:-translate-x-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 xl:left-8"
            aria-label="Previous service"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 top-1/2 z-40 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-800 shadow-lg backdrop-blur transition hover:translate-x-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 xl:right-8"
            aria-label="Next service"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200 bg-white/90 px-4 py-2 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label={paused ? "Play carousel" : "Pause carousel"}
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
        <div className="flex items-center gap-1.5">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(index)}
              className={cn(
                "h-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-amber-400",
                index === activeIndex ? "w-7 bg-amber-600" : "w-2.5 bg-slate-300 hover:bg-slate-400",
              )}
              aria-label={`Show service ${index + 1}`}
              aria-current={index === activeIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default DesktopCircularCarousel;
