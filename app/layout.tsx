import type { Metadata } from "next";
import { cookies } from "next/headers";
import "@/app/globals.css";
import { LanguageProvider, type Language } from "@/components/providers/language-provider";
import { ThemeProvider, type Theme } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: { default: "HiPER", template: "%s · HiPER" },
  description: "Hab Perbendaharaan Digital — Portal rasmi perbendaharaan JPP IPGKKB.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const language: Language = cookieStore.get("hiper-language")?.value === "en" ? "en" : "bm";
  const theme: Theme = cookieStore.get("hiper-theme")?.value === "light" ? "light" : "dark";

  return (
    <html lang={language === "bm" ? "ms" : "en"} data-theme={theme} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LanguageProvider initialLanguage={language}>
          <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
