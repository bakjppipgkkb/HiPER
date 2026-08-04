"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Language = "bm" | "en";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ initialLanguage, children }: { initialLanguage: Language; children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  const value = useMemo(() => ({
    language,
    setLanguage(next: Language) {
      setLanguageState(next);
      document.cookie = `hiper-language=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
      document.documentElement.lang = next === "bm" ? "ms" : "en";
    },
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider.");
  return context;
}
