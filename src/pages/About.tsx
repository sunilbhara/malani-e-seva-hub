import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LegalPage } from "@/components/common/LegalPage";
import { VisitUs } from "@/components/services/VisitUs";
import { BUSINESS } from "@/lib/business";

export default function About() {
  return (
    <>
      <LegalPage title="हमारे बारे में" path="/about" description={`${BUSINESS.nameHi}, बाड़मेर — सरकारी नौकरी अपडेट, ई-मित्र सेवाएँ, मोबाइल और फोटोग्राफी।`}>
        <p>
          {BUSINESS.nameHi} बाड़मेर (राजस्थान) में एक स्थानीय ई-मित्र केंद्र है, जिसे {BUSINESS.owner} चलाते हैं। हम ऑनलाइन फॉर्म,
          प्रमाण पत्र, बिल भुगतान जैसी सेवाओं के साथ मोबाइल-इलेक्ट्रॉनिक्स और माताजी स्टूडियो (फोटोग्राफी) की सेवाएँ देते हैं।
        </p>
        <p>
          इस वेबसाइट पर हम सरकारी नौकरी, एडमिट कार्ड और रिजल्ट की जानकारी सरल हिंदी में देते हैं — आधिकारिक स्रोत के लिंक के साथ —
          ताकि गाँव और छोटे शहरों के युवा कोई भी अंतिम तिथि न चूकें। फॉर्म भरने में मदद चाहिए तो दुकान पर आएँ या WhatsApp करें।
        </p>
        <h2>हमारा वादा</h2>
        <ul>
          <li>हर भर्ती के साथ आधिकारिक अधिसूचना और वेबसाइट का लिंक।</li>
          <li>तारीख बदलने पर तुरंत अपडेट, और साफ़-साफ़ “अपडेट” समय।</li>
          <li>आपकी जानकारी सुरक्षित — कभी बेची नहीं जाती।</li>
        </ul>
      </LegalPage>
      <div className="container-page max-w-3xl space-y-6 pb-8">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { key: "storefront", alt: "मालाणी मोबाइल की दुकान, बाड़मेर", caption: "हमारी दुकान — रेलवे स्टेशन के सामने" },
            { key: "owner", alt: "मालाणी मोबाइल का काउंटर", caption: "काउंटर पर — आपकी सेवा में" },
          ].map((p) => (
            <figure key={p.key}>
              <img src={`/shop/${p.key}-800.webp`} srcSet={`/shop/${p.key}-480.webp 480w, /shop/${p.key}-800.webp 800w`} sizes="(min-width: 640px) 360px, 100vw" alt={p.alt} width={800} height={500} loading="lazy" decoding="async" className="aspect-[4/3] w-full rounded-xl border object-cover" />
              <figcaption className="mt-1.5 font-hindi text-small text-muted-foreground">{p.caption}</figcaption>
            </figure>
          ))}
        </div>
        <VisitUs />
        <Button asChild className="font-hindi"><Link to="/jobs">नौकरियाँ देखें</Link></Button>
      </div>
    </>
  );
}
