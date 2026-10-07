import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Carousel } from "@/components/common/Carousel";
import { ServicePageTemplate } from "@/components/seo/ServicePageTemplate";
import { BookingForm } from "@/components/services/EnquiryForms";
import { queryKeys } from "@/lib/queryClient";
import { listCatalog, type CatalogItem } from "@/services/catalog";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

function Gallery() {
  const { messages } = useI18n();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<CatalogItem | null>(null);
  const { data = [], isLoading, isError } = useQuery({ queryKey: queryKeys.catalog("studio_photo"), queryFn: () => listCatalog("studio_photo") });
  const photos = filter === "all" ? data : data.filter((p) => p.category === filter);
  const categoryName = (id: string) => messages.homepage.matajiStudio.categories.find((c) => c.id === id)?.name ?? id;
  return (
    <section aria-labelledby="gallery-heading">
      <h2 id="gallery-heading" className="font-hindi text-xl font-bold sm:text-2xl">{messages.homepage.matajiStudio.title}</h2>
      <p className="mt-1 font-hindi text-small text-muted-foreground">{messages.homepage.matajiStudio.description}</p>
      <div className="-mx-4 mt-4 overflow-x-auto px-4 scrollbar-none">
        <div className="flex gap-2">
          {messages.homepage.matajiStudio.categories.map((c) => (
            <button key={c.id} type="button" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}
              className={cn("h-10 shrink-0 rounded-full border px-4 font-hindi text-small font-semibold", filter === c.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        {isLoading ? (
          <div aria-hidden className="mx-auto aspect-[3/4] w-4/5 max-w-sm animate-pulse rounded-2xl bg-muted" />
        ) : isError ? (
          <p className="font-hindi text-small text-muted-foreground">फोटो अभी लोड नहीं हो सकीं। कृपया थोड़ी देर बाद देखें।</p>
        ) : photos.length === 0 ? (
          <p className="font-hindi text-small text-muted-foreground">इस श्रेणी में अभी कोई फोटो नहीं है।</p>
        ) : (
          <Carousel
            key={filter}
            label="स्टूडियो फोटो"
            mobilePerView={1.6}
            items={photos}
            getKey={(p) => p.id}
            renderItem={(p) => (
              <button
                type="button"
                onClick={() => setOpen(p)}
                aria-label={`${p.title} — बड़ी फोटो देखें`}
                className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted shadow-md focus-visible:ring-2 focus-visible:ring-ring"
              >
                <img src={p.image_url} alt="" width={900} height={1200} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full border border-white/40 bg-black/35 px-2.5 py-1 font-hindi text-caption font-semibold text-white backdrop-blur-sm">
                  {categoryName(p.category)}
                </span>
                <span className="absolute inset-x-0 bottom-0 p-4 text-left font-hindi text-lg font-bold text-white drop-shadow">{p.title}</span>
              </button>
            )}
          />
        )}
      </div>
      <Dialog open={Boolean(open)} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">{open?.title}</DialogTitle>
          {open && <img src={open.image_url} alt={open.title} className="max-h-[80vh] w-full rounded-lg object-contain" />}
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
