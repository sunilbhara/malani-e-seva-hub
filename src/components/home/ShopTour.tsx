import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const saveData = () =>
  typeof navigator !== "undefined" && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
const reducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Short silent walk-through of the shop (vertical, ~10 s, 725 KB).
 * Nothing downloads until it scrolls into view; data-saver and reduced-motion users see the
 * still image and can start it with the play button.
 */
export function ShopTour({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const autoplay = !saveData() && !reducedMotion();

  useEffect(() => {
    const video = ref.current;
    if (!video || !autoplay || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().then(() => setPlaying(true)).catch(() => undefined);
        else {
          video.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [autoplay]);

  function toggle() {
    const video = ref.current;
    if (!video) return;
    if (video.paused) void video.play().then(() => setPlaying(true)).catch(() => undefined);
    else {
      video.pause();
      setPlaying(false);
    }
  }

  return (
    <figure className={cn("grid items-center gap-5 rounded-xl border bg-card p-4 shadow-1 sm:grid-cols-[minmax(0,15rem)_1fr] sm:p-5", className)}>
      <div className="relative mx-auto w-full max-w-[15rem] overflow-hidden rounded-xl bg-muted">
        <video
          ref={ref}
          src="/shop/shop-tour.mp4"
          poster="/shop/shop-tour-poster.webp"
          width={540}
          height={960}
          muted
          loop
          playsInline
          preload="none"
          aria-label="मालाणी मोबाइल शोरूम का वीडियो टूर"
          className="aspect-[9/16] w-full object-cover"
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "वीडियो रोकें" : "वीडियो चलाएँ"}
          className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-px" />}
        </button>
      </div>
      <figcaption className="space-y-2 text-center sm:text-left">
        <p className="font-hindi text-xl font-bold">दुकान घूमकर देखिए</p>
        <p className="font-hindi text-body text-muted-foreground">
          सैकड़ों मोबाइल एक्सेसरीज़, चार्जर, ईयरफ़ोन और स्पीकर — दुकान पर आकर देखें और परखें। रेलवे स्टेशन के सामने, हाई स्कूल रोड, बाड़मेर।
        </p>
      </figcaption>
    </figure>
  );
}
