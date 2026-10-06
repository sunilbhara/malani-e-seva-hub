import { Link, useSearchParams } from "react-router-dom";
import { CircleAlert, MailCheck, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";

const STATES = {
  confirmed: { icon: MailCheck, title: "ईमेल की पुष्टि हो गई!", text: "हर रविवार आपको हफ़्ते की नई नौकरियाँ और अंतिम तिथि वाली भर्तियाँ ईमेल पर मिलेंगी।" },
  unsubscribed: { icon: MailX, title: "अनसब्सक्राइब हो गया", text: "अब आपको हमारे ईमेल नहीं आएँगे। आप कभी भी दोबारा जुड़ सकते हैं।" },
  invalid: { icon: CircleAlert, title: "लिंक मान्य नहीं है", text: "यह लिंक पुराना हो गया है या पहले इस्तेमाल हो चुका है।" },
} as const;

/** Landing page for newsletter confirm/unsubscribe links (audit S7). */
export default function Newsletter() {
  const [params] = useSearchParams();
  const key = (params.get("status") ?? "invalid") as keyof typeof STATES;
  const state = STATES[key] ?? STATES.invalid;
  const Icon = state.icon;
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-10">
      <SEO title={`${state.title} | मालाणी बाड़मेर`} description={state.text} path="/newsletter" noindex />
      <div className="max-w-md rounded-2xl border bg-card p-8 text-center">
        <Icon aria-hidden className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 font-hindi text-2xl font-bold">{state.title}</h1>
        <p className="mt-2 font-hindi text-body text-body">{state.text}</p>
        <Button asChild className="mt-6 font-hindi"><Link to="/jobs">नौकरियाँ देखें</Link></Button>
      </div>
    </div>
  );
}
