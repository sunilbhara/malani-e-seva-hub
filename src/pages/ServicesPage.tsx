import { useState } from "react";
import { FileText, MessageCircle, Search } from "lucide-react";
import { ServicePageTemplate } from "@/components/seo/ServicePageTemplate";
import { EMITRA_GROUPS } from "@/config/emitraServices";
import { whatsappHref } from "@/lib/business";
import { formatRupees } from "@/lib/format";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

/** E-Mitra services grouped in tabs, with a search, the documents to bring and a WhatsApp action per service. */
function PriceList() {
  const [tab, setTab] = useState(EMITRA_GROUPS[0].title);
  const [q, setQ] = useState("");
  const query = q.trim();
  const services = query
    ? EMITRA_GROUPS.flatMap((g) => g.services).filter((s) => s.name.includes(query) || s.documents.some((d) => d.includes(query)))
    : (EMITRA_GROUPS.find((g) => g.title === tab) ?? EMITRA_GROUPS[0]).services;

  return (
    <section aria-labelledby="price-heading" className="space-y-4">
      <div>
        <h2 id="price-heading" className="flex items-center gap-2.5 font-hindi text-xl font-bold sm:text-2xl">
          <span aria-hidden className="h-5 w-1.5 shrink-0 rounded-full bg-accent" />
          सेवाएँ, शुल्क और ज़रूरी दस्तावेज़
        </h2>
        <p className="mt-1 font-hindi text-small text-muted-foreground">दुकान आने से पहले देख लें कि कौनसे दस्तावेज़ लाने हैं — या WhatsApp पर भेज दें।</p>
      </div>

      <div className="relative max-w-md">
        <label htmlFor="service-search" className="sr-only">सेवा खोजें</label>
        <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          id="service-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="सेवा खोजें — जैसे आधार, जाति, बिल"
          className="h-11 w-full rounded-xl border border-input bg-card pl-11 pr-3 font-hindi text-body placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {!query && (
        <div className="rail-fade -mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0 sm:[mask-image:none]">
          <div className="flex gap-2" role="group" aria-label="सेवा की श्रेणी">
            {EMITRA_GROUPS.map((g) => (
              <button
                key={g.title}
                type="button"
                aria-pressed={tab === g.title}
                onClick={() => setTab(g.title)}
                className={cn("h-11 shrink-0 rounded-full border px-4 font-hindi text-small font-semibold", tab === g.title ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}
              >
                {g.title} <span className="tabular opacity-70">({g.services.length})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-center font-hindi text-small text-muted-foreground">“{query}” से जुड़ी सेवा नहीं मिली। WhatsApp पर पूछें — ज़्यादातर सरकारी काम हम करते हैं।</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {services.map((s) => (
            <li key={s.name} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-hindi text-lg font-semibold leading-snug">{s.name}</h3>
                {s.price !== null ? (
                  <span className="shrink-0 rounded-lg bg-status-open-bg px-2.5 py-1 font-hindi text-small font-bold text-status-open tabular">{formatRupees(s.price)} से</span>
                ) : (
                  <span className="shrink-0 rounded-lg bg-muted px-2.5 py-1 font-hindi text-caption text-muted-foreground">शुल्क पूछें</span>
                )}
              </div>
              {s.documents.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 font-hindi text-small font-semibold text-muted-foreground">
                    <FileText aria-hidden className="h-4 w-4" /> साथ लाएँ
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {s.documents.map((d) => (
                      <li key={d} className="rounded-full border bg-background px-2.5 py-1 font-hindi text-small">{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              <a
                href={whatsappHref(`नमस्ते, मुझे "${s.name}" करवाना है। शुल्क और ज़रूरी दस्तावेज़ बताइए।`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 font-hindi text-small font-semibold text-whatsapp-foreground"
              >
                <MessageCircle aria-hidden className="h-4 w-4" /> WhatsApp पर पूछें / दस्तावेज़ भेजें
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ServicesPage() {
  const { messages } = useI18n();
  const page = messages.seoPages.services;
  return (
    <ServicePageTemplate
      photo="emitra"
      photoAlt="मालाणी ई-मित्र केंद्र का काउंटर, बाड़मेर"
      path="/services"
      seoTitle={page.title}
      seoDescription={page.description}
      eyebrow={page.heroEyebrow}
      title={page.heroTitle}
      description={page.heroDescription}
      bullets={page.heroBullets}
      overviewTitle={page.overviewTitle}
      overviewText={page.overviewText}
      sectionTitle={page.sectionTitle}
      cards={messages.seoPages.serviceCards.services}
      faqTitle={page.faqTitle}
      faqs={messages.seoPages.faqs.services}
      ctaTitle={page.ctaTitle}
      ctaDescription={page.ctaDescription}
      whatsappText="नमस्ते, मुझे ई-मित्र सेवा के बारे में जानकारी चाहिए।"
      relatedTitle={messages.seoPages.common.relatedLabel}
      relatedLinks={[
        { title: messages.footer.links.mobile, description: "मोबाइल, एक्सेसरीज़ और इलेक्ट्रॉनिक्स", to: "/mobile-electronics" },
        { title: messages.footer.links.studio, description: "पासपोर्ट फोटो, शादी और प्री-वेडिंग फोटोग्राफी", to: "/mataji-studio" },
        { title: "सरकारी नौकरियाँ", description: "नई भर्ती और अंतिम तिथियाँ", to: "/jobs" },
      ]}
      breadcrumbHome={messages.seoPages.common.breadcrumbHome}
    >
      <PriceList />
    </ServicePageTemplate>
  );
}
