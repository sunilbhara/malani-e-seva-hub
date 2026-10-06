import { useEffect, useRef, useState } from "react";
import { Clock, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS, directionsHref, fullAddress, isOpenAt, telHref, whatsappHref } from "@/lib/business";
import { cn } from "@/lib/utils";

const EMBED = `https://www.google.com/maps?q=${BUSINESS.geo.latitude},${BUSINESS.geo.longitude}&z=17&output=embed`;

/** Shop location: a lazy map iframe instead of the heavy Maps JavaScript API (audit P3). */
export function VisitUs({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [showMap, setShowMap] = useState(false);
  const open = isOpenAt(new Date());

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShowMap(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setShowMap(true);
        io.disconnect();
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section aria-labelledby="visit-heading" className={cn("grid gap-4 rounded-2xl border bg-card p-5 lg:grid-cols-2", className)}>
      <div className="space-y-4">
        <h2 id="visit-heading" className="font-hindi text-xl font-bold">दुकान पर आएँ</h2>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-hindi text-caption", open ? "bg-status-open-bg text-status-open" : "bg-status-closed-bg text-status-closed")}>
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" /> {open ? "अभी खुली है" : "अभी बंद है"}
        </span>
        <ul className="space-y-3 font-hindi text-small text-body">
          <li className="flex gap-2.5"><MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {fullAddress("hi")}</li>
          <li className="flex gap-2.5"><Clock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {BUSINESS.hoursTextHi}</li>
          <li className="flex gap-2.5"><Phone aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> <a href={telHref} className="tabular hover:text-foreground">{BUSINESS.phone}</a></li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="whatsapp" className="font-hindi"><a href={whatsappHref()} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp</a></Button>
          <Button asChild variant="outline" className="font-hindi"><a href={telHref}><Phone /> कॉल करें</a></Button>
          <Button asChild variant="outline" className="font-hindi"><a href={directionsHref} target="_blank" rel="noopener noreferrer"><Navigation /> रास्ता देखें</a></Button>
        </div>
      </div>
      <div ref={ref} className="aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
        {showMap && (
          <iframe
            title="मालाणी बाड़मेर का नक्शा"
            src={EMBED}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full"
          />
        )}
      </div>
    </section>
  );
}
