import { ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectCoverflow, FreeMode } from "swiper/modules";
import type { SwiperOptions } from "swiper/types";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";
import "swiper/css/free-mode";

/**
 * Reusable mobile-only Swiper wrapper.
 * Defaults to a smooth autoplay carousel with a peek of the next slide
 * to invite swiping. Use `variant="coverflow"` for a stacked/3D feel.
 */
export type MobileSwiperProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  variant?: "default" | "coverflow" | "free";
  slidesPerView?: number;
  spaceBetween?: number;
  autoplayDelay?: number;
  className?: string;
  slideClassName?: string;
  paginationColorVar?: string; // CSS var or color for active dot
};

export function MobileSwiper<T>({
  items,
  renderItem,
  variant = "default",
  slidesPerView = 1.15,
  spaceBetween = 16,
  autoplayDelay = 3000,
  className = "",
  slideClassName = "",
  paginationColorVar = "#a855f7",
}: MobileSwiperProps<T>) {
  const baseProps: SwiperOptions = {
    modules: [Autoplay, Pagination, EffectCoverflow, FreeMode],
    loop: items.length > 2,
    grabCursor: true,
    speed: 700,
    autoplay: {
      delay: autoplayDelay,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
    pagination: { clickable: true, dynamicBullets: true },
  };

  const variantProps: SwiperOptions =
    variant === "coverflow"
      ? {
          effect: "coverflow",
          centeredSlides: true,
          slidesPerView: 1.2,
          coverflowEffect: {
            rotate: 0,
            stretch: 0,
            depth: 120,
            modifier: 2.5,
            slideShadows: false,
          },
        }
      : variant === "free"
      ? {
          freeMode: { enabled: true, momentum: true },
          slidesPerView,
          spaceBetween,
        }
      : { slidesPerView, spaceBetween, centeredSlides: false };

  return (
    <div
      className={`mobile-swiper-wrap ${className}`}
      style={
        {
          // Themed pagination
          ["--swiper-pagination-color" as any]: paginationColorVar,
          ["--swiper-pagination-bullet-inactive-color" as any]: "#cbd5e1",
          ["--swiper-pagination-bullet-inactive-opacity" as any]: "0.6",
        } as React.CSSProperties
      }
    >
      <Swiper {...baseProps} {...variantProps} className="!pb-10">
        {items.map((item, i) => (
          <SwiperSlide key={i} className={slideClassName}>
            {renderItem(item, i)}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default MobileSwiper;
