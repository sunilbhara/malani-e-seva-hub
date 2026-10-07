import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ServicePageTemplate } from "@/components/seo/ServicePageTemplate";
import { BookingForm } from "@/components/services/EnquiryForms";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

const PHOTOS = [
  { id: 1, category: "weddings", title: "Royal Wedding Ceremony", image: "https://images.unsplash.com/photo-1587271636175-90d58cdad458?w=800&auto=format&q=70&fit=crop" },
  { id: 2, category: "portraits", title: "Professional Portrait", image: "https://images.unsplash.com/photo-1587027512547-81850a319ff5?w=600&h=800&fit=crop&auto=format&q=70" },
  { id: 3, category: "events", title: "Mega Event", image: "https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?w=800&auto=format&q=70&fit=crop" },
  { id: 4, category: "events", title: "Haldi Shoot", image: "https://images.unsplash.com/photo-1645856052472-95fe99103c11?w=800&fit=crop&auto=format&q=70" },
  { id: 5, category: "portraits", title: "Family Portrait", image: "https://images.unsplash.com/photo-1640953148126-1962ec17a92b?w=800&fit=crop&auto=format&q=70" },
  { id: 6, category: "events", title: "Birthday Celebration", image: "https://images.unsplash.com/photo-1756621716907-6451161cd100?w=600&h=800&auto=format&fit=crop&q=70" },
  { id: 7, category: "weddings", title: "Couple Photoshoot", image: "https://res.cloudinary.com/duovfafmc/image/upload/f_auto,q_auto,w_800/matajiphoto1_itgrfu.jpg" },
  { id: 8, category: "events", title: "Independence Day Event", image: "https://images.unsplash.com/photo-1597536980706-7cdd82f1bb16?w=800&auto=format&fit=crop&q=70" },
  { id: 9, category: "weddings", title: "Wedding Moments", image: "https://images.unsplash.com/photo-1633104502699-b2ecf0fee294?w=600&h=800&fit=crop&auto=format&q=70" },
  { id: 10, category: "weddings", title: "Pre-Wedding Shoot", image: "https://images.unsplash.com/photo-1677770753024-25f65003625b?w=600&h=800&fit=crop&auto=format&q=70" },
  { id: 11, category: "weddings", title: "Couple Portrait", image: "https://res.cloudinary.com/duovfafmc/image/upload/f_auto,q_auto,w_800/pci2_e5lwhc.jpg" },
];

function Gallery() {
  const { messages } = useI18n();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<(typeof PHOTOS)[number] | null>(null);
  const photos = filter === "all" ? PHOTOS : PHOTOS.filter((p) => p.category === filter);
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
      <div className="mt-4 columns-2 gap-3 md:columns-3">
        {photos.map((p) => (
          <button key={p.id} type="button" onClick={() => setOpen(p)} className="mb-3 block w-full overflow-hidden rounded-xl border focus-visible:ring-2 focus-visible:ring-ring">
            <img src={p.image} alt={p.title} loading="lazy" decoding="async" className="w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
          </button>
        ))}
      </div>
      <Dialog open={Boolean(open)} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">{open?.title}</DialogTitle>
          {open && <img src={open.image} alt={open.title} className="max-h-[80vh] w-full rounded-lg object-contain" />}
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
