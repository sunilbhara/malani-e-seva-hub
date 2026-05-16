import { Languages } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { languageOptions, useI18n } from "@/i18n";

type LanguageSwitcherProps = {
  className?: string;
};

export default function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { language, setLanguage, messages } = useI18n();

  return (
    <div className={className}>
      <Select value={language} onValueChange={(value) => setLanguage(value as typeof language)}>
        <SelectTrigger
          aria-label={messages.languageSwitcher.label}
          className="h-10 min-w-[130px] rounded-full border border-amber-200/70 bg-white/80 px-3 text-sm font-semibold text-gray-800 shadow-sm backdrop-blur-sm focus:ring-amber-300"
        >
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-amber-700" />
            <SelectValue placeholder={messages.languageSwitcher.placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-amber-100 bg-white/95 shadow-xl">
          {languageOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="rounded-xl py-2">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
