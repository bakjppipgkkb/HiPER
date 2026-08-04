import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Hab Perbendaharaan Digital</span>
            <h1>Pengurusan kewangan yang cekap, telus dan berintegriti.</h1>
            <p>Platform digital rasmi Pejabat Bendahari Agung Kehormat untuk perkhidmatan pelajar, rekod perbendaharaan dan penyampaian maklumat JPP IPGKKB.</p>
            <div className="button-row">
              <Link href="/announcements" className="button button--gold">Lihat pengumuman</Link>
              <Link href="/studio/login" className="button button--outline">HiPER Studio</Link>
            </div>
          </div>
          <div className="hero-card">
            <img src="/hiper-mark.svg" alt="Logo HiPER" />
            <strong>HiPER v2 Foundation</strong>
            <span>Supabase · typed data · no production demo fallback</span>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container card-grid">
          {[
            ["iAset", "Permohonan, kelulusan, penyerahan dan pemulangan aset."],
            ["iKES", "Pengurusan bantuan kebajikan dan rekod pembayaran balik."],
            ["Tabung Jumaat", "Kutipan, agihan dan paparan rekod yang diluluskan."],
            ["Pengumuman", "Makluman rasmi dwibahasa dengan satu medan poster."],
          ].map(([title, body]) => <article className="feature-card" key={title}><h2>{title}</h2><p>{body}</p></article>)}
        </div>
      </section>
    </>
  );
}
