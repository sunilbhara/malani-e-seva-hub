import { ServicePageTemplate } from "@/components/seo/ServicePageTemplate";
import { ShopTour } from "@/components/home/ShopTour";
import { ProductCatalog } from "@/components/shop/ProductCatalog";
import { useI18n } from "@/i18n";

export default function MobileElectronicsPage() {
  const { messages } = useI18n();
  const page = messages.seoPages.mobile;
  return (
    <ServicePageTemplate
      photo="owner"
      photoAlt="मालाणी मोबाइल शोरूम का काउंटर"
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
      <ProductCatalog />
      <ShopTour />
    </ServicePageTemplate>
  );
}
