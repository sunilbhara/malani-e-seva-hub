import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, MessageCircle, Phone } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import { VisitUs } from "@/components/services/VisitUs";
import { ContactForm } from "@/components/services/EnquiryForms";
import { ShopStrip } from "@/components/home/ShopStrip";
import { buildBreadcrumbSchema, buildFaqSchema, buildLocalBusinessSchema } from "@/lib/seo";
import { telHref, whatsappHref } from "@/lib/business";
import { useI18n } from "@/i18n";
import type { FaqItem } from "@/i18n/types";

export interface ServicePageTemplateProps {
  path: string;
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  overviewTitle: string;
  overviewText: string;
  sectionTitle: string;
  cards: Array<{ title: string; description: string; bullets: string[] }>;
  faqTitle: string;
  faqs: FaqItem[];
  ctaTitle: string;
  ctaDescription: string;
  whatsappText: string;
  relatedTitle: string;
  relatedLinks: Array<{ title: string; description: string; to: string }>;
  breadcrumbHome: string;
  /** Page-specific sections (price list, product grid, gallery…) shown after the hero. */
  children?: ReactNode;
  showContactForm?: boolean;
  /** Real shop photo from public/shop/ shown in the header. */
  photo?: "emitra" | "mobile" | "studio" | "owner" | "interior";
  photoAlt?: string;
}

export function ServicePageTemplate(props: ServicePageTemplateProps) {
  const { messages } = useI18n();
  return (
    <>
      <SEO
        title={props.seoTitle}
        description={props.seoDescription}
        path={props.path}
        jsonLd={[
          buildBreadcrumbSchema([{ name: props.breadcrumbHome, path: "/" }, { name: props.title, path: props.path }]),
          buildFaqSchema(props.faqs),
          buildLocalBusinessSchema(),
        ]}
      />

      <section className="border-b bg-card">
        <div className="container-page grid gap-6 py-6 sm:py-10 md:grid-cols-[1.25fr_1fr] md:items-center">
          <div>
            <p className="font-hindi text-small font-semibold text-link">{props.eyebrow}</p>
            <h1 className="mt-2 max-w-3xl font-hindi text-[1.75rem] font-bold leading-tight sm:text-[2.5rem]">{props.title}</h1>
            <p className="mt-3 max-w-2xl font-hindi text-body text-muted-foreground">{props.description}</p>
            <ul className="mt-4 space-y-2">
              {props.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 font-hindi text-body">
                  <CheckCircle2 aria-hidden className="mt-1 h-4 w-4 shrink-0 text-status-open" /> {b}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="whatsapp" size="lg" className="font-hindi">
                <a href={whatsappHref(props.whatsappText)} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp करें</a>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-hindi"><a href={telHref}><Phone /> कॉल करें</a></Button>
            </div>
          </div>
          {props.photo && (
            <img
              src={`/shop/${props.photo}-800.webp`}
              srcSet={`/shop/${props.photo}-480.webp 480w, /shop/${props.photo}-800.webp 800w`}
              sizes="(min-width: 768px) 40vw, 100vw"
              alt={props.photoAlt ?? ""}
              width={800}
              height={600}
              className="order-first aspect-[16/9] w-full rounded-xl border object-cover md:order-none md:aspect-[4/3]"
            />
          )}
        </div>
      </section>

      <div className="container-page space-y-12 py-10">
        {props.children}

        <section aria-labelledby="overview-heading" className="max-w-3xl">
          <h2 id="overview-heading" className="font-hindi text-xl font-bold sm:text-2xl">{props.overviewTitle}</h2>
          <p className="mt-3 font-hindi text-body leading-relaxed text-body">{props.overviewText}</p>
        </section>

        <section aria-labelledby="cards-heading">
          <h2 id="cards-heading" className="mb-4 font-hindi text-xl font-bold sm:text-2xl">{props.sectionTitle}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {props.cards.map((card) => (
              <article key={card.title} className="rounded-2xl border bg-card p-5">
                <h3 className="font-hindi text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 font-hindi text-small text-muted-foreground">{card.description}</p>
                <ul className="mt-3 space-y-1.5">
                  {card.bullets.map((b) => (
                    <li key={b} className="flex gap-2 font-hindi text-small"><CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-status-open" /> {b}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <ShopStrip current={props.path} showHelp={false} />

        <VisitUs />

        {props.showContactForm !== false && (
          <section aria-labelledby="contact-heading" className="rounded-2xl border bg-card p-5">
            <h2 id="contact-heading" className="font-hindi text-xl font-bold">{messages.forms.contact.title}</h2>
            <p className="mb-4 font-hindi text-small text-muted-foreground">{messages.forms.contact.subtitle}</p>
            <ContactForm />
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section aria-labelledby="faq-heading" className="rounded-2xl border bg-card p-5">
            <h2 id="faq-heading" className="font-hindi text-xl font-bold">{props.faqTitle}</h2>
            <Accordion type="single" collapsible className="mt-3">
              {props.faqs.map((faq, i) => (
                <AccordionItem key={faq.question} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left font-hindi font-semibold hover:no-underline">{faq.question}</AccordionTrigger>
                  <AccordionContent className="font-hindi text-body text-body">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
          <section aria-labelledby="related-heading" className="rounded-2xl border bg-card p-5">
            <h2 id="related-heading" className="font-hindi text-xl font-bold">{props.relatedTitle}</h2>
            <nav className="mt-3 space-y-2">
              {props.relatedLinks.map((link) => (
                <Link key={link.to} to={link.to} className="group flex items-start justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-muted">
                  <span>
                    <span className="block font-hindi font-semibold">{link.title}</span>
                    <span className="block font-hindi text-small text-muted-foreground">{link.description}</span>
                  </span>
                  <ArrowRight aria-hidden className="mt-1 h-4 w-4 shrink-0 text-link" />
                </Link>
              ))}
            </nav>
          </section>
        </div>

        <section className="rounded-2xl bg-brand p-6 text-brand-foreground sm:p-8">
          <h2 className="font-hindi text-xl font-bold text-brand-foreground sm:text-2xl">{props.ctaTitle}</h2>
          <p className="mt-2 max-w-2xl font-hindi text-[1rem] leading-relaxed text-brand-foreground/90">{props.ctaDescription}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="accent" size="lg" className="font-hindi">
              <a href={whatsappHref(props.whatsappText)} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp करें</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/30 bg-transparent font-hindi text-brand-foreground hover:bg-white/10"><a href={telHref}><Phone /> कॉल करें</a></Button>
          </div>
        </section>
      </div>
    </>
  );
}
