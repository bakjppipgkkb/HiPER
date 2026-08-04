import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminState } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const admin = await getAdminState();
  if (admin.status === "anonymous") redirect("/studio/login");

  if (admin.status === "unconfigured") {
    return <main className="studio-page"><div className="studio-panel"><h1>Supabase belum dikonfigurasi</h1><p>Ikuti docs/SUPABASE_SETUP.md dahulu.</p></div></main>;
  }

  if (admin.status === "forbidden") {
    return <main className="studio-page"><div className="studio-panel"><h1>Akses pentadbir diperlukan</h1><p>{admin.email ?? "Akaun ini"} belum mempunyai peranan ADMIN.</p><Link href="/auth/signout" className="button button--outline">Log keluar</Link></div></main>;
  }

  return (
    <main className="studio-page">
      <aside className="studio-sidebar"><div className="brand"><img src="/hiper-mark.svg" alt="HiPER" /><span><strong>HiPER Studio</strong><small>{admin.email}</small></span></div><nav><a href="#ringkasan">Ringkasan</a><a href="#pengumuman">Pengumuman</a><a href="#tabung">Tabung Jumaat</a><a href="#organisasi">Organisasi</a></nav><Link href="/auth/signout">Log keluar</Link></aside>
      <section className="studio-content"><span className="eyebrow">Foundation</span><h1>Struktur Studio telah dipisahkan daripada portal awam.</h1><div className="studio-grid">{["Site Settings", "Pengumuman", "Tabung Jumaat", "Organisasi"].map((name) => <article className="studio-panel" key={name}><h2>{name}</h2><p>Form end-to-end akan dibina dan diuji sebagai Pull Request modul tersendiri.</p></article>)}</div></section>
    </main>
  );
}
