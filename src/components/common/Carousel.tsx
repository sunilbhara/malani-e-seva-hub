import { useState, type CSSProperties, type ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, EffectCoverflow, Keyboard, Pagination } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";

interface CarouselProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  /** Accessible name, e.g. "प्रोडक्ट". */
  label: string;
  autoplayDelay?: number;
  /** Cards visible on phones (the centre one plus peeks of its neighbours). */
  mobilePerView?: number;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Coverflow carousel for the shop pages: one card with a peek of its neighbours on phones,
 * three on desktop. Autoplay stops for reduced-motion users and while hovered or touched.
 * Uses rewind instead of loop so slides are never duplicated for screen readers.
 */
export function Carousel<T>({ items, getKey, renderItem, label, autoplayDelay = 3500, mobilePerView = 1.25 }: CarouselProps<T>) {
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  if (!items.length) return null;

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      style={
        {
          "--swiper-pagination-color": "hsl(var(--primary))",
          "--swiper-pagination-bullet-inactive-color": "hsl(var(--muted-foreground))",
          "--swiper-pagination-bullet-inactive-opacity": "0.35",
        } as CSSProperties
      }
    >
      <Swiper
        modules={[A11y, Autoplay, EffectCoverflow, Keyboard, Pagination]}
        onSwiper={setSwiper}
        effect="coverflow"
        coverflowEffect={{ rotate: 0, stretch: 0, depth: 110, modifier: 2, slideShadows: false }}
        centeredSlides
        rewind={items.length > 1}
        grabCursor
        speed={600}
        slidesPerView={mobilePerView}
        initialSlide={items.length >= 3 ? 1 : 0}
        spaceBetween={12}
        breakpoints={{ 640: { slidesPerView: 2.2, spaceBetween: 16 }, 1024: { slidesPerView: 3, spaceBetween: 20 } }}
        autoplay={items.length > 1 && !prefersReducedMotion() ? { delay: autoplayDelay, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
        keyboard={{ enabled: true, onlyInViewport: true }}
        pagination={{ clickable: true, dynamicBullets: items.length > 5 }}
        a11y={{
          prevSlideMessage: "पिछला",
          nextSlideMessage: "अगला",
          firstSlideMessage: "पहली स्लाइड",
          lastSlideMessage: "आख़िरी स्लाइड",
          paginationBulletMessage: "स्लाइड {{index}} दिखाएँ",
          slideLabelMessage: "{{index}} / {{slidesLength}}",
        }}
        className="!px-1 !pb-10"
      >
        {items.map((item, i) => (
          <SwiperSlide key={getKey(item)} className="!h-auto">
            {renderItem(item, i)}
          </SwiperSlide>
        ))}
      </Swiper>
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => swiper?.slidePrev()}
            aria-label="पिछला"
            className="absolute left-1 top-[42%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border bg-card/95 shadow-md transition hover:bg-card focus-visible:ring-2 focus-visible:ring-ring sm:flex"
          >
            <ChevronLeft aria-hidden className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => swiper?.slideNext()}
            aria-label="अगला"
            className="absolute right-1 top-[42%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border bg-card/95 shadow-md transition hover:bg-card focus-visible:ring-2 focus-visible:ring-ring sm:flex"
          >
            <ChevronRight aria-hidden className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
