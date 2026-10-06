import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Turnstile, turnstileRequired } from "@/components/common/Turnstile";
import { subscribeNewsletter } from "@/services/newsletter";
import { FunctionError } from "@/services/functions";
import { track } from "@/lib/analytics";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";

/** Weekly email digest signup with explicit consent and double opt-in (audit S7, DPDP). */
export function NewsletterForm({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | "pending" | "already_subscribed">(null);
  const [unavailable, setUnavailable] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!consent) {
      toast.error("कृपया सहमति वाले बॉक्स पर टिक करें।");
      return;
    }
    if (turnstileRequired() && !token) {
      toast.error("सुरक्षा जाँच पूरी होने दें, फिर दोबारा दबाएँ।");
      return;
    }
    setBusy(true);
    try {
      const res = await subscribeNewsletter({ email, categories: [], turnstileToken: token });
      setDone(res.status);
      track("newsletter_subscribe");
    } catch (error) {
      if (error instanceof FunctionError && error.code === "not_configured") setUnavailable(true);
      else toast.error(error instanceof Error ? error.message : "सब्सक्राइब नहीं हो सका।");
    } finally {
      setBusy(false);
    }
  }

  if (unavailable || !config.newsletterEnabled) return null;

  return (
    <section aria-labelledby="newsletter-heading" className={cn("rounded-2xl border bg-card p-5", className)}>
      <h2 id="newsletter-heading" className="font-hindi text-lg font-bold">हर रविवार ईमेल पर हफ़्ते की नौकरियाँ</h2>
      {done ? (
        <p role="status" className="mt-3 font-hindi text-small text-body">
          {done === "already_subscribed"
            ? "आप पहले से सब्सक्राइब हैं। धन्यवाद!"
            : "लगभग हो गया! अपने ईमेल में आया पुष्टि लिंक दबाएँ (स्पैम फ़ोल्डर भी देखें)।"}
        </p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-3 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">ईमेल</label>
            <Input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="आपका ईमेल"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
            <Button type="submit" disabled={busy} className="font-hindi">
              <Mail /> {busy ? "भेज रहे हैं…" : "सब्सक्राइब"}
            </Button>
          </div>
          <label className="flex items-start gap-2.5 font-hindi text-small text-muted-foreground">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
            <span>मैं मालाणी बाड़मेर से नौकरी अपडेट ईमेल पाना चाहता/चाहती हूँ। कभी भी अनसब्सक्राइब कर सकते हैं।</span>
          </label>
          <Turnstile onToken={setToken} />
        </form>
      )}
    </section>
  );
}
