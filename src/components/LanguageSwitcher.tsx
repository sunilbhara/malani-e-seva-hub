import { Languages } from "lucide-react";
import { languageOptions, useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

/** Compact हिंदी / English toggle for the service pages' content. */
export default function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useI18n();
  const current = language === "default" ? "en" : language;
  return (
    <div role="radiogroup" aria-label="भाषा / Language" className={cn("inline-flex items-center gap-1 rounded-full border bg-background p-0.5", className)}>
      <Languages aria-hidden className="ml-2 h-4 w-4 text-muted-foreground" />
      {languageOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={current === option.value}
          onClick={() => setLanguage(option.value)}
          className={cn(
            "h-8 rounded-full px-3 text-caption transition-colors",
            current === option.value ? "bg-primary text-primary-foreground" : "font-normal text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
