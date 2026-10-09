import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LoadingLabel, Skeleton } from "@/components/common/Skeleton";
import { ServicePageTemplate } from "@/components/seo/ServicePageTemplate";
import { BookingForm } from "@/components/services/EnquiryForms";
import { queryKeys } from "@/lib/queryClient";
import { listCatalog } from "@/services/catalog";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

/** Photo grid (2–4 columns) with a full-screen viewer that steps through the filtered photos. */
function Gallery() {
  const { messages } = useI18n();
  const [filter, setFilter] = useState("all");
  const [index, setIndex] = useState<number | null>(null);
  const { data = [], isLoading, isError } = useQuery({ queryKey: queryKeys.catalog("studio_photo"), queryFn: () => listCatalog("studio_photo") });
  const photos = filter === "all" ? data : data.filter((p) => p.category === filter);
  const categoryName = (id: string) => messages.homepage.matajiStudio.categories.find((c) => c.id === id)?.name ?? id;
  const open = index !== null ? photos[index] : null;
  const step = (d: number) => setIndex((i) => (i === null || !photos.length ? i : (i + d + photos.length) % photos.length));

  return (
    <section aria-labelledby="gallery-heading">
      <h2 id="gallery-heading" className="flex items-center gap-2.5 font-hindi text-xl font-bold sm:text-2xl">
        <span aria-hidden className="h-5 w-1.5 shrink-0 rounded-full bg-accent" />
        {messages.homepage.matajiStudio.title}
      </h2>
      <p className="mt-1 font-hindi text-small text-muted-foreground">{messages.homepage.matajiStudio.description}</p>
      <div className="rail-fade -mx-4 mt-4 overflow-x-auto px-4 scrollbar-none sm:[mask-image:none]">
        <div className="flex gap-2" role="group" aria-label="फोटो की श्रेणी">
          {messages.homepage.matajiStudio.categories.map((c) => (
            <button key={c.id} type="button" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}
              className={cn("h-11 shrink-0 rounded-full border px-4 font-hindi text-small font-semibold", filter === c.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" aria-busy="true">
            <LoadingLabel text="फोटो लोड हो रही हैं…" />
            {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}
          </div>
        ) : isError ? (
          <p className="font-hindi text-small text-muted-foreground">फोटो अभी लोड नहीं हो सकीं। कृपया थोड़ी देर बाद देखें।</p>
        ) : photos.length === 0 ? (
          <p className="font-hindi text-small text-muted-foreground">इस श्रेणी में अभी कोई फोटो नहीं है।</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" aria-label="स्टूडियो फोटो">
            {photos.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`${p.title} — बड़ी फोटो देखें`}
                  className="group relative block aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted shadow-1 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <img src={p.image_url} alt="" width={900} height={1200} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 font-hindi text-caption text-white backdrop-blur-sm">
                    {categoryName(p.category)}
                  </span>
                  <span className="absolute inset-x-0 bottom-0 p-3 text-left font-hindi font-bold text-white drop-shadow">{p.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Dialog open={Boolean(open)} onOpenChange={(v) => !v && setIndex(null)}>
        <DialogContent
          className="max-w-3xl bg-black p-2 sm:p-3"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
          }}
        >
          <DialogTitle className="sr-only">{open?.title}</DialogTitle>
          {open && (
            <div className="relative">
              <img src={open.image_url} alt={open.title} className="max-h-[80vh] w-full rounded-lg object-contain" />
              <p className="mt-2 text-center font-hindi text-small text-white/85">
                {open.title} · <span className="tabular">{(index ?? 0) + 1}/{photos.length}</span>
              </p>
              {photos.length > 1 && (
                <>
                  <button type="button" onClick={() => step(-1)} aria-label="पिछली फोटो" className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white hover:bg-black/75">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button type="button" onClick={() => step(1)} aria-label="अगली फोटो" className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white hover:bg-black/75">
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default function MatajiStudioPage() {
  const { messages } = useI18n();
  const page = messages.seoPages.studio;
  return (
    <ServicePageTemplate
      photo="studio"
      photoAlt="माताजी स्टूडियो की शादी की फोटो"
      path="/mataji-studio"
      seoTitle={page.title}
      seoDescription={page.description}
      eyebrow={page.heroEyebrow}
      title={page.heroTitle}
      description={page.heroDescription}
      bullets={page.heroBullets}
      overviewTitle={page.overviewTitle}
      overviewText={page.overviewText}
      sectionTitle={page.sectionTitle}
      cards={messages.seoPages.serviceCards.studio}
      faqTitle={page.faqTitle}
      faqs={messages.seoPages.faqs.studio}
      ctaTitle={page.ctaTitle}
      ctaDescription={page.ctaDescription}
      whatsappText="नमस्ते, मुझे माताजी स्टूडियो में फोटो सेशन बुक करना है।"
      relatedTitle={messages.seoPages.common.relatedLabel}
      relatedLinks={[
        { title: messages.footer.links.services, description: "ऑनलाइन फॉर्म, प्रमाण पत्र, बिल भुगतान", to: "/services" },
        { title: messages.footer.links.mobile, description: "मोबाइल और एक्सेसरीज़", to: "/mobile-electronics" },
      ]}
      breadcrumbHome={messages.seoPages.common.breadcrumbHome}
      showContactForm={false}
    >
      <Gallery />
      <section aria-labelledby="booking-heading" className="grid gap-6 rounded-2xl border bg-card p-5 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 id="booking-heading" className="font-hindi text-xl font-bold">{messages.forms.booking.title}</h2>
          <p className="mt-1 font-hindi text-small text-muted-foreground">{messages.homepage.matajiStudio.whyTitle}</p>
          <ul className="mt-3 space-y-1.5">
            {messages.homepage.matajiStudio.whyItems.map((w) => (
              <li key={w} className="flex gap-2 font-hindi text-small"><CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-status-open" /> {w}</li>
            ))}
          </ul>
        </div>
        <BookingForm />
      </section>
    </ServicePageTemplate>
  );
}
