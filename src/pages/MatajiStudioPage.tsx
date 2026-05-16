import { ServicePageTemplate } from "@/components/seo/ServicePageTemplate";
import { useI18n } from "@/i18n";

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
      ctaPrimary={page.ctaPrimary}
      ctaPrimaryHref="/#contact"
      ctaSecondary={page.ctaSecondary}
      ctaSecondaryHref="/services"
      relatedTitle={messages.seoPages.common.relatedLabel}
      relatedLinks={[
        {
          title: messages.footer.links.services,
          description: "Need online document support too? Explore our E-Mitra service page for local digital help.",
          to: "/services",
        },
        {
          title: messages.footer.links.mobile,
          description: "Visit our mobile and electronics page for gadget guidance and showroom details.",
          to: "/mobile-electronics",
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
