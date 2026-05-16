import { ArrowRight, CheckCircle, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { absoluteUrl, buildBreadcrumbSchema, buildFaqSchema, buildLocalBusinessSchema } from "@/lib/seo";
import type { FaqItem } from "@/i18n/types";

type RelatedLink = {
  title: string;
  description: string;
  to: string;
};

type ServicePageTemplateProps = {
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
  ctaPrimary: string;
  ctaPrimaryHref: string;
  ctaSecondary: string;
  ctaSecondaryHref: string;
  relatedTitle: string;
  relatedLinks: RelatedLink[];
  breadcrumbHome: string;
  locationTitle: string;
  locationText: string;
  blogTitle: string;
  blogDescription: string;
  blogCta: string;
  overviewLabel?: string;
};

export function ServicePageTemplate(props: ServicePageTemplateProps) {
  const breadcrumbs = buildBreadcrumbSchema([
    { name: props.breadcrumbHome, path: "/" },
    { name: props.title, path: props.path },
  ]);
  const primaryHref = props.ctaPrimaryHref.startsWith("http") || props.ctaPrimaryHref.startsWith("tel:")
    ? props.ctaPrimaryHref
    : absoluteUrl(props.ctaPrimaryHref);

  return (
    <SiteLayout>
      <SEO
        title={props.seoTitle}
        description={props.seoDescription}
        path={props.path}
        keywords={[props.title, "Malani Barmer", "Barmer Rajasthan 344001"]}
        jsonLd={[breadcrumbs, buildFaqSchema(props.faqs), buildLocalBusinessSchema()]}
      />

      <main>
        <section className="px-4 pb-8">
          <div className="container mx-auto">
            <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-white via-blue-50 to-amber-50 px-6 py-12 shadow-xl sm:px-10">
              <div className="max-w-4xl space-y-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">{props.eyebrow}</p>
                <header className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">{props.title}</h1>
                  <p className="max-w-3xl text-lg leading-relaxed text-gray-600 sm:text-xl">{props.description}</p>
                </header>
                <div className="grid gap-3 sm:grid-cols-3">
                  {props.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-white/80 p-4 shadow-sm">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600" />
                      <span className="text-sm font-medium text-gray-700">{bullet}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild className="rounded-full bg-gradient-to-r from-[#ef4444] via-[#b45309] to-[#f59e0b] text-white shadow-lg">
                    <Link to={props.ctaPrimaryHref}>{props.ctaPrimary}</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-amber-200 bg-white/80">
                    <Link to={props.ctaSecondaryHref}>{props.ctaSecondary}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="container mx-auto grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
            <article className="rounded-[2rem] border border-blue-100 bg-white/90 p-8 shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">{props.overviewLabel ?? "Overview"}</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">{props.overviewTitle}</h2>
              <p className="mt-4 text-base leading-8 text-gray-600">{props.overviewText}</p>
            </article>

            <aside className="rounded-[2rem] border border-amber-100 bg-white/90 p-8 shadow-lg">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-amber-700" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{props.locationTitle}</h2>
                  <p className="mt-2 text-sm leading-7 text-gray-600">{props.locationText}</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="container mx-auto">
            <header className="mb-8 max-w-3xl">
              <h2 className="text-3xl font-bold text-gray-900">{props.sectionTitle}</h2>
            </header>
            <div className="grid gap-6 lg:grid-cols-3">
              {props.cards.map((card) => (
                <Card key={card.title} className="border-0 bg-white/85 shadow-xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl text-gray-900">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-7 text-gray-600">{card.description}</p>
                    <div className="space-y-3">
                      {card.bullets.map((bullet) => (
                        <div key={bullet} className="flex items-start gap-3 text-sm text-gray-700">
                          <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-600" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="container mx-auto grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2rem] border border-purple-100 bg-white/90 p-8 shadow-lg">
              <h2 className="text-3xl font-bold text-gray-900">{props.faqTitle}</h2>
              <Accordion type="single" collapsible className="mt-6 space-y-3">
                {props.faqs.map((faq, index) => (
                  <AccordionItem key={faq.question} value={`faq-${index}`} className="rounded-2xl border border-gray-100 px-5">
                    <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-7 text-gray-600">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-sky-100 bg-white/90 p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900">{props.blogTitle}</h2>
                <p className="mt-3 text-sm leading-7 text-gray-600">{props.blogDescription}</p>
                <Button asChild variant="outline" className="mt-5 rounded-full border-sky-200 bg-sky-50/70">
                  <Link to="/blog">{props.blogCta}</Link>
                </Button>
              </div>

              <div className="rounded-[2rem] border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900">{props.relatedTitle}</h2>
                <nav className="mt-5 space-y-4" aria-label="Related service pages">
                  {props.relatedLinks.map((link) => (
                    <Link key={link.to} to={link.to} className="group block rounded-2xl border border-white bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-amber-700">{link.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-gray-600">{link.description}</p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-amber-700" />
                      </div>
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 pb-16">
          <div className="container mx-auto">
            <div className="rounded-[2rem] bg-gradient-to-r from-slate-900 via-slate-800 to-amber-900 p-8 text-white shadow-2xl">
              <h2 className="text-3xl font-bold">{props.ctaTitle}</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">{props.ctaDescription}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-white text-slate-900 hover:bg-white/90">
                  <a href={primaryHref}>
                    {props.ctaPrimary}
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20">
                  <Link to={props.ctaSecondaryHref}>{props.ctaSecondary}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
