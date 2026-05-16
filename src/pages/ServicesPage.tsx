import { ServicePageTemplate } from "@/components/seo/ServicePageTemplate";
import { useI18n } from "@/i18n";

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
      ctaPrimary={page.ctaPrimary}
      ctaPrimaryHref="/#contact"
      ctaSecondary={page.ctaSecondary}
      ctaSecondaryHref="/mobile-electronics"
      relatedTitle={messages.seoPages.common.relatedLabel}
      relatedLinks={[
        {
          title: messages.footer.links.mobile,
          description: "Explore our dedicated mobile showroom page for gadgets, accessories and buyer guidance.",
          to: "/mobile-electronics",
        },
        {
          title: messages.footer.links.studio,
          description: "Visit the Mataji Studio page for pre wedding, haldi and couple photography services.",
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
