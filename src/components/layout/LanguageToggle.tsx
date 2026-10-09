import { useEffect } from "react";
import { Languages } from "lucide-react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

/** Turns English mode on/off for the whole reader interface (see i18n/domTranslate.ts). */
export function useEnglishMode() {
  const { language } = useI18n();
  const english = language === "en" || language === "default";
  useEffect(() => {
    if (!english) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    void import("@/i18n/domTranslate").then(({ startEnglish }) => {
      if (!cancelled) stop = startEnglish();
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [english]);
}

/** One-tap हिंदी ↔ English switch for the header. The label is a fixed pair so it is never translated. */
export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useI18n();
  const english = language === "en" || language === "default";
  return (
    <button
      type="button"
      data-no-translate
      onClick={() => setLanguage(english ? "hi" : "en")}
      aria-label={english ? "हिंदी में देखें" : "View in English"}
      lang={english ? "hi" : "en"}
      className={cn("flex h-10 items-center gap-1.5 rounded-full px-2.5 text-small font-semibold transition-colors hover:bg-white/10", className)}
    >
      <Languages aria-hidden className="h-4 w-4" />
      <span>{english ? "हिंदी" : "EN"}</span>
    </button>
  );
}
