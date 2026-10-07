import { MessageCircle } from "lucide-react";
import { ServicePageTemplate } from "@/components/seo/ServicePageTemplate";
import { EMITRA_GROUPS } from "@/config/emitraServices";
import { whatsappHref } from "@/lib/business";
import { formatRupees } from "@/lib/format";
import { useI18n } from "@/i18n";

function PriceList() {
  return (
    <section aria-labelledby="price-heading">
      <h2 id="price-heading" className="font-hindi text-xl font-bold sm:text-2xl">सेवाएँ, शुल्क और ज़रूरी दस्तावेज़</h2>
      <p className="mt-1 font-hindi text-small text-muted-foreground">दुकान आने से पहले देख लें कि कौनसे दस्तावेज़ लाने हैं।</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {EMITRA_GROUPS.map((group) => (
          <article key={group.title} className="rounded-2xl border bg-card p-5">
            <h3 className="font-hindi text-lg font-semibold">{group.title}</h3>
            <ul className="mt-3 divide-y">
              {group.services.map((s) => (
                <li key={s.name} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-hindi font-medium">{s.name}</p>
                    {s.price !== null ? (
                      <span className="shrink-0 font-semibold tabular">{formatRupees(s.price)}</span>
                    ) : (
                      <a
                        href={whatsappHref(`नमस्ते, "${s.name}" का शुल्क क्या है?`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 font-hindi text-small font-semibold text-primary"
                      >
                        <MessageCircle className="h-4 w-4" /> दाम पूछें
                      </a>
                    )}
                  </div>
                  {s.documents.length > 0 && (
                    <p className="mt-1 font-hindi text-small text-muted-foreground">लाएँ: {s.documents.join(", ")}</p>
                  )}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ServicesPage() {
  const { messages } = useI18n();
  const page = messages.seoPages.services;
  return (
    <ServicePageTemplate
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
