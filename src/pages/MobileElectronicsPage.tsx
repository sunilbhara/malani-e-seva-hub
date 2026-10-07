import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Carousel } from "@/components/common/Carousel";
import { ServicePageTemplate } from "@/components/seo/ServicePageTemplate";
import { whatsappHref } from "@/lib/business";
import { formatPrice } from "@/lib/catalogImage";
import { queryKeys } from "@/lib/queryClient";
import { listCatalog, type CatalogItem } from "@/services/catalog";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

function ProductCard({ p }: { p: CatalogItem }) {
  const price = formatPrice(p.price);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      <img src={p.image_url} alt={p.title} width={800} height={800} loading="lazy" decoding="async" className="aspect-square w-full bg-muted object-cover" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold leading-snug">{p.title}</h3>
        <p className="text-lg font-bold tabular">{price ?? <span className="font-hindi text-base font-semibold text-muted-foreground">दाम के लिए पूछें</span>}</p>
        {p.features.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {p.features.map((f) => <li key={f} className="rounded-full bg-muted px-2 py-0.5 text-caption font-normal text-muted-foreground">{f}</li>)}
          </ul>
        )}
        <Button asChild variant="whatsapp" size="sm" className="mt-auto font-hindi">
          <a href={whatsappHref(`नमस्ते, मुझे ${p.title} के बारे में जानकारी चाहिए (दाम और उपलब्धता)।`)} target="_blank" rel="noopener noreferrer">
            <MessageCircle /> पूछें
          </a>
        </Button>
      </div>
    </article>
  );
}

function ProductGrid() {
  const { messages } = useI18n();
  const [filter, setFilter] = useState("all");
  const categories = messages.homepage.mobileElectronics.categories;
  const { data = [], isLoading, isError } = useQuery({ queryKey: queryKeys.catalog("product"), queryFn: () => listCatalog("product") });
  const products = filter === "all" ? data : data.filter((p) => p.category === filter);
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
      <div className="mt-4">
        {isLoading ? (
          <div aria-hidden className="mx-auto aspect-[4/5] w-4/5 max-w-sm animate-pulse rounded-2xl bg-muted" />
        ) : isError ? (
          <p className="font-hindi text-small text-muted-foreground">प्रोडक्ट अभी लोड नहीं हो सके। कृपया थोड़ी देर बाद देखें या WhatsApp करें।</p>
        ) : products.length === 0 ? (
          <p className="font-hindi text-small text-muted-foreground">इस श्रेणी में अभी कोई प्रोडक्ट नहीं है। जानकारी के लिए WhatsApp करें।</p>
        ) : (
          <Carousel key={filter} label="प्रोडक्ट" items={products} getKey={(p) => p.id} renderItem={(p) => <ProductCard p={p} />} />
        )}
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
