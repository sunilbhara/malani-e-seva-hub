import { MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS, directionsHref, telHref, whatsappHref } from "@/lib/business";
import { formHelpMessage } from "@/lib/share";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/** Turns readers into shop customers (Blueprint Loop 7). */
export function FormHelpCard({ postTitle, className }: { postTitle?: string; className?: string }) {
  return (
    <section aria-labelledby="form-help-heading" className={cn("rounded-2xl border border-accent/40 bg-accent-soft p-5", className)}>
      <h2 id="form-help-heading" className="font-hindi text-lg font-bold text-foreground">
        {postTitle ? "यह फॉर्म हमसे भरवाएँ — सही, जल्दी, बिना गलती" : "फॉर्म भरने में परेशानी? हम भर देंगे"}
      </h2>
      <p className="mt-1.5 font-hindi text-small text-body">
        {BUSINESS.nameHi}, {BUSINESS.address.cityHi}। दस्तावेज़ WhatsApp पर भेजें या दुकान पर आएँ।
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant="whatsapp" className="font-hindi">
          <a
            href={whatsappHref(formHelpMessage(postTitle))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("form_help_click", { from: postTitle ? "post" : "card", channel: "whatsapp" })}
          >
            <MessageCircle /> WhatsApp करें
          </a>
        </Button>
        <Button asChild variant="outline" className="font-hindi">
          <a href={telHref} onClick={() => track("form_help_click", { from: postTitle ? "post" : "card", channel: "call" })}>
            <Phone /> कॉल करें
          </a>
        </Button>
        <Button asChild variant="ghost" className="font-hindi">
          <a href={directionsHref} target="_blank" rel="noopener noreferrer">
            <MapPin /> दुकान का पता
          </a>
        </Button>
      </div>
    </section>
  );
}
