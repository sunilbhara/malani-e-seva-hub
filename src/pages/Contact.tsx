import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LegalPage } from "@/components/common/LegalPage";
import { ContactForm } from "@/components/services/EnquiryForms";
import { VisitUs } from "@/components/services/VisitUs";
import { BUSINESS, fullAddress, telHref, whatsappHref } from "@/lib/business";

export default function Contact() {
  return (
    <>
      <LegalPage title="संपर्क करें" path="/contact" description={`${BUSINESS.nameHi}, बाड़मेर से संपर्क करें — फोन, WhatsApp, पता और संदेश फॉर्म।`}>
        <p>
          किसी भर्ती की जानकारी में गलती दिखे, फॉर्म भरवाना हो, या साइट के बारे में कोई सवाल हो — हमें बताइए। हम आम तौर पर दुकान के समय में उसी दिन जवाब देते हैं।
        </p>
        <h2>संपर्क विवरण</h2>
        <ul>
          <li><strong>नाम:</strong> {BUSINESS.nameHi} ({BUSINESS.owner})</li>
          <li><strong>पता:</strong> {fullAddress("hi")}</li>
          <li><strong>फोन / WhatsApp:</strong> <a href={telHref}>{BUSINESS.phone}</a></li>
          {BUSINESS.email && <li><strong>ईमेल:</strong> <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></li>}
          <li><strong>समय:</strong> {BUSINESS.hoursTextHi}</li>
        </ul>
        <div className="not-prose flex flex-wrap gap-2">
          <Button asChild variant="whatsapp" className="font-hindi no-underline">
            <a href={whatsappHref("नमस्ते, मुझे malanibarmer.com के बारे में बात करनी है।")} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp करें</a>
          </Button>
          <Button asChild variant="outline" className="font-hindi no-underline">
            <a href={telHref}><Phone /> कॉल करें</a>
          </Button>
        </div>
      </LegalPage>
      <div className="container-page max-w-3xl space-y-6 pb-8">
        <figure>
          <img src="/shop/storefront-night-800.webp" srcSet="/shop/storefront-night-480.webp 480w, /shop/storefront-night-800.webp 800w, /shop/storefront-night-1200.webp 1200w" sizes="(min-width: 768px) 720px, 100vw" alt="रात में रोशन मालाणी मोबाइल की दुकान, बाड़मेर" width={800} height={450} loading="lazy" decoding="async" className="aspect-video w-full rounded-xl border object-cover" />
          <figcaption className="mt-1.5 font-hindi text-small text-muted-foreground">रात 8 बजे तक खुली — रेलवे स्टेशन के सामने, हाई स्कूल रोड</figcaption>
        </figure>
        <section aria-labelledby="contact-form-heading" className="rounded-2xl border bg-card p-5">
          <h2 id="contact-form-heading" className="mb-3 font-hindi text-xl font-bold">संदेश भेजें</h2>
          <ContactForm />
        </section>
        <VisitUs />
      </div>
    </>
  );
}
