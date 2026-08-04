"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ initialTheme, children }: { initialTheme: Theme; children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const value = useMemo(() => ({
    theme,
    setTheme(next: Theme) {
      setThemeState(next);
      document.cookie = `hiper-theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
      document.documentElement.dataset.theme = next;
    },
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider.");
  return context;
}
