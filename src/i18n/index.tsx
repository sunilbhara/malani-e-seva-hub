import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultMessages, languageOptions, type DeepPartial, type MessageCatalog } from "./defaultMessages";
import { hindiOverrides } from "./hindiOverrides";
import type { Language } from "./types";

const STORAGE_KEY = "malani-language";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, override?: DeepPartial<T>): T {
  if (!override) return base;
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };

  Object.entries(override as Record<string, unknown>).forEach(([key, value]) => {
    const baseValue = result[key];
    if (Array.isArray(value)) {
      result[key] = value;
      return;
    }
    if (isObject(baseValue) && isObject(value)) {
      result[key] = deepMerge(baseValue, value as DeepPartial<typeof baseValue>);
      return;
    }
    result[key] = value;
  });

  return result as T;
}

const catalogs: Record<Language, MessageCatalog> = {
  default: defaultMessages,
  hi: deepMerge<MessageCatalog>(defaultMessages, hindiOverrides),
  en: defaultMessages,
};

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  messages: MessageCatalog;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Hindi-first (Blueprint §3): readers get Hindi unless they chose English before.
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved === "hi" || saved === "en" || saved === "default" ? saved : "hi";
    } catch {
      return "hi";
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // storage unavailable
    }
    document.documentElement.lang = catalogs[language].locale;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      messages: catalogs[language],
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export { languageOptions };
