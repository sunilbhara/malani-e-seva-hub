import { ServicePageTemplate } from "@/components/seo/ServicePageTemplate";
import { useI18n } from "@/i18n";

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
      ctaPrimary={page.ctaPrimary}
      ctaPrimaryHref="/#contact"
      ctaSecondary={page.ctaSecondary}
      ctaSecondaryHref="/mataji-studio"
      relatedTitle={messages.seoPages.common.relatedLabel}
      relatedLinks={[
        {
          title: messages.footer.links.services,
          description: "See our E-Mitra and cyber cafe support page for online documentation and digital services.",
          to: "/services",
        },
        {
          title: messages.footer.links.studio,
          description: "Discover our dedicated photography page for pre wedding, haldi and event coverage.",
          to: "/mataji-studio",
        },
      ]}
      breadcrumbHome={messages.seoPages.common.breadcrumbHome}
      locationTitle={messages.seoPages.common.locationTitle}
      locationText={messages.seoPages.common.locationText}
      blogTitle={messages.seoPages.common.blogTitle}
      blogDescription={messages.seoPages.common.blogDescription}
      blogCta={messages.seoPages.common.blogCta}
      overviewLabel={messages.seoPages.common.overviewLabel}
    />
  );
}
