import { useEffect, useState } from "react";
import { BellRing, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { config } from "@/lib/config";
import { pushPermission, pushSupported, subscribeToPush } from "@/lib/push";
import { loadPreferences, topicsFor } from "@/lib/preferences";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/** "Get alerts where you already are" — WhatsApp Channel, Telegram, web push (Blueprint Loop 1). */
export function AlertsCard({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [busy, setBusy] = useState(false);

  useEffect(() => setPermission(pushPermission()), []);

  const canPush = pushSupported();
  if (!config.whatsappChannelUrl && !config.telegramChannelUrl && !canPush) return null;

  async function enablePush() {
    setBusy(true);
    try {
      await subscribeToPush(topicsFor(loadPreferences()));
      setPermission("granted");
      track("push_subscribe", { from: "alerts_card" });
      toast.success("नोटिफ़िकेशन चालू हो गए। नई भर्ती आते ही आपको सूचना मिलेगी।");
    } catch (error) {
      setPermission(pushPermission());
      toast.error(error instanceof Error ? error.message : "नोटिफ़िकेशन चालू नहीं हो सके।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="alerts-heading" className={cn("rounded-2xl border bg-card p-5", className)}>
      <h2 id="alerts-heading" className="font-hindi text-lg font-bold">नई भर्ती की सूचना सबसे पहले पाएँ</h2>
      {!compact && <p className="mt-1 font-hindi text-small text-muted-foreground">जहाँ आप पहले से हैं, वहीं अलर्ट पाएँ — बिलकुल मुफ़्त।</p>}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {config.whatsappChannelUrl && (
          <Button asChild variant="whatsapp" className="font-hindi">
            <a href={config.whatsappChannelUrl} target="_blank" rel="noopener noreferrer" onClick={() => track("channel_click", { channel: "whatsapp" })}>
              <MessageCircle /> WhatsApp चैनल
            </a>
          </Button>
        )}
        {config.telegramChannelUrl && (
          <Button asChild variant="outline" className="font-hindi">
            <a href={config.telegramChannelUrl} target="_blank" rel="noopener noreferrer" onClick={() => track("channel_click", { channel: "telegram" })}>
              <Send /> Telegram
            </a>
          </Button>
        )}
        {canPush && (
          <Button type="button" variant={permission === "granted" ? "secondary" : "default"} className="font-hindi" disabled={busy || permission === "granted" || permission === "denied"} onClick={() => void enablePush()}>
            <BellRing />
            {permission === "granted" ? "नोटिफ़िकेशन चालू हैं" : permission === "denied" ? "ब्राउज़र में अनुमति बंद है" : busy ? "चालू हो रहा है…" : "नोटिफ़िकेशन चालू करें"}
          </Button>
        )}
      </div>
    </section>
  );
}
