"use client";

import { useLanguage } from "@/components/providers/language-provider";

export function SiteFooter() {
  const { language } = useLanguage();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="brand footer-brand">
          <img src="/hiper-mark.svg" alt="HiPER" />
          <span><strong>Hab Perbendaharaan Digital</strong><small>{language === "bm" ? "Portal rasmi perbendaharaan JPP IPGKKB" : "Official JPP IPGKKB treasury portal"}</small></span>
        </div>
        <address>
          <strong>Pejabat Bendahari Agung Kehormat</strong><br />
          Jawatankuasa Perwakilan Pelajar<br />
          Institut Pendidikan Guru Kampus Kota Bharu
        </address>
      </div>
    </footer>
  );
}
