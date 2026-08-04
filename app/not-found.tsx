import Link from "next/link";

export default function NotFound() {
  return <main className="section"><div className="container container--narrow"><span className="eyebrow">404</span><h1>Halaman tidak ditemui</h1><Link className="button button--outline" href="/">Kembali ke Utama</Link></div></main>;
}
