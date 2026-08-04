"use client";

import { useLanguage } from "@/components/providers/language-provider";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="segmented" role="group" aria-label="Language">
      <button type="button" aria-pressed={language === "bm"} onClick={() => setLanguage("bm")}>BM</button>
      <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
    </div>
  );
}
