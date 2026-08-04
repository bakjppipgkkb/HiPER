"use client";

import Link from "next/link";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { useLanguage } from "@/components/providers/language-provider";

const links = [
  ["/", "Utama", "Home"],
  ["/announcements", "Pengumuman", "Announcements"],
  ["/tabung-jumaat", "Tabung Jumaat", "Friday Fund"],
  ["/organisation", "Organisasi", "Organisation"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();

  return (
    <header className="site-header">
      <div className="container header-row">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <img src="/hiper-mark.svg" alt="HiPER" />
          <span><strong>HiPER</strong><small>Hab Perbendaharaan Digital</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([href, bm, en]) => <Link key={href} href={href}>{language === "bm" ? bm : en}</Link>)}
        </nav>
        <div className="header-tools">
          <LanguageSwitcher />
          <ThemeToggle />
          <button type="button" className="menu-button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((value) => !value)}>{open ? "×" : "☰"}</button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="mobile-nav container" aria-label="Mobile navigation">
          {links.map(([href, bm, en]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{language === "bm" ? bm : en}</Link>)}
          <Link href="/permohonan" onClick={() => setOpen(false)}>{language === "bm" ? "Permohonan Saya" : "My Applications"}</Link>
          <Link href="/studio/login" onClick={() => setOpen(false)}>{language === "bm" ? "Pentadbir" : "Administrator"}</Link>
        </nav>
      )}
    </header>
  );
}
