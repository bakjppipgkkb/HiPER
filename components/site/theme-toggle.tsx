"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { useLanguage } from "@/components/providers/language-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { language } = useLanguage();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button className="icon-button" type="button" onClick={() => setTheme(next)} aria-label={language === "bm" ? `Tukar kepada mod ${next === "dark" ? "gelap" : "cerah"}` : `Switch to ${next} mode`}>
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
