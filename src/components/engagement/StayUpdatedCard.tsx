import { useEffect, useState, type ReactNode } from "react";
import { BellRing, ChevronDown, ChevronRight, Mail, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { NewsletterForm } from "@/components/engagement/NewsletterForm";
import { config } from "@/lib/config";
import { whatsappHref } from "@/lib/business";
import { pushPermission, pushSupported, subscribeToPush } from "@/lib/push";
import { loadPreferences, topicsFor } from "@/lib/preferences";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const WHATSAPP_ALERT_MESSAGE = "नमस्ते, मुझे नई सरकारी भर्ती की सूचना WhatsApp पर भेजें।";

function OptionRow({
  icon,
  iconClass,
  title,
  text,
  trailing,
  className,
}: {
  icon: ReactNode;
  iconClass: string;
  title: string;
  text: string;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("flex min-h-16 w-full items-center gap-3 rounded-xl border bg-background px-3.5 py-3 text-left transition-colors", className)}>
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", iconClass)}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-hindi font-semibold text-foreground">{title}</span>
        <span className="block font-hindi text-small text-muted-foreground">{text}</span>
      </span>
      {trailing ?? <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground" />}
    </span>
  );
}

/**
 * One "how do you want job alerts?" card instead of separate push / email cards (UX audit v2 #5).
 * WhatsApp comes first because that is where this audience already is; it falls back to a chat
 * with the shop when no WhatsApp Channel is configured.
 */
export function StayUpdatedCard({ className }: { className?: string }) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [busy, setBusy] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const canPush = pushSupported();

  useEffect(() => setPermission(pushPermission()), []);

  async function enablePush() {
    setBusy(true);
    try {
      await subscribeToPush(topicsFor(loadPreferences()));
      setPermission("granted");
      track("push_subscribe", { from: "stay_updated" });
      toast.success("नोटिफ़िकेशन चालू हो गए। नई भर्ती आते ही आपको सूचना मिलेगी।");
    } catch (error) {
      setPermission(pushPermission());
      toast.error(error instanceof Error ? error.message : "नोटिफ़िकेशन चालू नहीं हो सके।");
    } finally {
      setBusy(false);
    }
  }

  const whatsappUrl = config.whatsappChannelUrl || whatsappHref(WHATSAPP_ALERT_MESSAGE);

  return (
    <section aria-labelledby="stay-updated-heading" className={cn("rounded-xl border bg-card p-4 shadow-1 sm:p-5", className)}>
      <h2 id="stay-updated-heading" className="font-hindi text-lg font-bold">नई भर्ती की खबर सबसे पहले पाएँ</h2>
      <p className="mt-0.5 font-hindi text-small text-muted-foreground">जो तरीका आसान लगे, वही चुनें — बिलकुल मुफ़्त।</p>

      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        <li>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("channel_click", { channel: config.whatsappChannelUrl ? "whatsapp" : "whatsapp_chat" })}
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <OptionRow
              icon={<MessageCircle aria-hidden className="h-5 w-5" />}
              iconClass="bg-whatsapp text-whatsapp-foreground"
              title={config.whatsappChannelUrl ? "WhatsApp चैनल से जुड़ें" : "WhatsApp पर सूचना पाएँ"}
              text="सबसे आसान — फ़ोन पर सीधे"
              className="border-whatsapp/40 bg-whatsapp/5 hover:bg-whatsapp/10"
            />
          </a>
        </li>
        {config.telegramChannelUrl && (
          <li>
            <a
              href={config.telegramChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("channel_click", { channel: "telegram" })}
              className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <OptionRow
                icon={<Send aria-hidden className="h-5 w-5" />}
                iconClass="bg-secondary text-secondary-foreground"
                title="Telegram चैनल"
                text="हर नई पोस्ट की सूचना"
                className="hover:bg-muted"
              />
            </a>
          </li>
        )}
        {canPush && (
          <li>
            <button
              type="button"
              onClick={() => void enablePush()}
              disabled={busy || permission === "granted" || permission === "denied"}
              className="block w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
            >
              <OptionRow
                icon={<BellRing aria-hidden className="h-5 w-5" />}
                iconClass="bg-primary text-primary-foreground"
                title={permission === "granted" ? "नोटिफ़िकेशन चालू हैं" : busy ? "चालू हो रहा है…" : "फ़ोन पर नोटिफ़िकेशन"}
                text={permission === "denied" ? "ब्राउज़र सेटिंग में अनुमति बंद है" : "ऐप जैसा अलर्ट, बिना ऐप डाउनलोड"}
                trailing={permission === "granted" ? <span className="font-hindi text-caption text-status-open">✓</span> : undefined}
                className={permission === "granted" || permission === "denied" ? "opacity-80" : "hover:bg-muted"}
              />
            </button>
          </li>
        )}
        {config.newsletterEnabled && (
          <li className={cn(emailOpen && "md:col-span-2")}>
            <button
              type="button"
              onClick={() => setEmailOpen((v) => !v)}
              aria-expanded={emailOpen}
              aria-controls="stay-updated-email"
              className="block w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <OptionRow
                icon={<Mail aria-hidden className="h-5 w-5" />}
                iconClass="bg-accent-soft text-foreground ring-1 ring-accent/40"
                title="हर रविवार ईमेल"
                text="हफ़्ते की सभी नौकरियाँ एक ईमेल में"
                trailing={<ChevronDown aria-hidden className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", emailOpen && "rotate-180")} />}
                className="hover:bg-muted"
              />
            </button>
            {emailOpen && (
              <div id="stay-updated-email" className="mt-2">
                <NewsletterForm embedded />
              </div>
            )}
          </li>
        )}
      </ul>
    </section>
  );
}
