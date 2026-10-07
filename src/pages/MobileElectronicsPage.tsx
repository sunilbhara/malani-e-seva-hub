import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServicePageTemplate } from "@/components/seo/ServicePageTemplate";
import { whatsappHref } from "@/lib/business";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

const PRODUCTS = [
  { id: 1, name: "iPhone 15 Pro", category: "mobiles", price: "₹1,34,900", image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=480&h=480&fit=crop&auto=format&q=70", features: ["A17 Pro Chip", "48MP Camera", "Titanium Build"] },
  { id: 2, name: "Samsung Galaxy S24", category: "mobiles", price: "₹79,999", image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=480&h=480&fit=crop&auto=format&q=70", features: ["AI Photography", "120Hz Display", "5000mAh Battery"] },
  { id: 3, name: "Sony WH-1000XM5", category: "accessories", price: "₹29,990", image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=480&h=480&fit=crop&auto=format&q=70", features: ["Noise Cancelling", "30hr Battery", "Premium Sound"] },
  { id: 4, name: "MacBook Air M3", category: "appliances", price: "₹1,14,900", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=480&h=480&fit=crop&auto=format&q=70", features: ["M3 Chip", "18hr Battery", "Liquid Retina"] },
  { id: 5, name: "AirPods Pro", category: "accessories", price: "₹24,900", image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=480&h=480&fit=crop&auto=format&q=70", features: ["Active Noise Cancel", "Spatial Audio", "MagSafe Case"] },
  { id: 6, name: 'LG OLED TV 55"', category: "appliances", price: "₹1,49,990", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=480&h=480&fit=crop&auto=format&q=70", features: ["4K OLED", "Smart TV", "Dolby Vision"] },
];

function ProductGrid() {
  const { messages } = useI18n();
  const [filter, setFilter] = useState("all");
  const categories = messages.homepage.mobileElectronics.categories;
  const products = filter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);
  return (
    <section aria-labelledby="products-heading">
      <h2 id="products-heading" className="font-hindi text-xl font-bold sm:text-2xl">{messages.homepage.mobileElectronics.title}</h2>
      <p className="mt-1 font-hindi text-small text-muted-foreground">दाम बदल सकते हैं — ताज़ा दाम और उपलब्धता के लिए WhatsApp करें।</p>
      <div className="-mx-4 mt-4 overflow-x-auto px-4 scrollbar-none">
        <div className="flex gap-2">
          {categories.map((c) => (
            <button key={c.id} type="button" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}
              className={cn("h-10 shrink-0 rounded-full border px-4 font-hindi text-small font-semibold", filter === c.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {products.map((p) => (
          <article key={p.id} className="flex flex-col overflow-hidden rounded-2xl border bg-card">
            <img src={p.image} alt={p.name} width={480} height={480} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
            <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
              <h3 className="font-semibold leading-snug">{p.name}</h3>
              <p className="text-lg font-bold tabular">{p.price}</p>
              <ul className="hidden flex-wrap gap-1 sm:flex">
                {p.features.map((f) => <li key={f} className="rounded-full bg-muted px-2 py-0.5 text-caption font-normal text-muted-foreground">{f}</li>)}
              </ul>
              <Button asChild variant="whatsapp" size="sm" className="mt-auto font-hindi">
                <a href={whatsappHref(`नमस्ते, मुझे ${p.name} के बारे में जानकारी चाहिए (दाम और उपलब्धता)।`)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle /> पूछें
                </a>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function MobileElectronicsPage() {
  const { messages } = useI18n();
  const page = messages.seoPages.mobile;
  return (
    <ServicePageTemplate
      path="/mobile-electronics"
      seoTitle={page.title}
      seoDescription={page.description}
      eyebrow={page.heroEyebrow}
      title={page.heroTitle}
      description={page.heroDescription}
      bullets={page.heroBullets}
      overviewTitle={page.overviewTitle}
      overviewText={page.overviewText}
      sectionTitle={page.sectionTitle}
      cards={messages.seoPages.serviceCards.mobile}
      faqTitle={page.faqTitle}
      faqs={messages.seoPages.faqs.mobile}
      ctaTitle={page.ctaTitle}
      ctaDescription={page.ctaDescription}
      whatsappText="नमस्ते, मुझे मोबाइल/इलेक्ट्रॉनिक्स के बारे में जानकारी चाहिए।"
      relatedTitle={messages.seoPages.common.relatedLabel}
      relatedLinks={[
        { title: messages.footer.links.services, description: "ऑनलाइन फॉर्म, प्रमाण पत्र, बिल भुगतान", to: "/services" },
        { title: messages.footer.links.studio, description: "फोटोग्राफी और पासपोर्ट फोटो", to: "/mataji-studio" },
      ]}
      breadcrumbHome={messages.seoPages.common.breadcrumbHome}
    >
      <ProductGrid />
    </ServicePageTemplate>
  );
}
