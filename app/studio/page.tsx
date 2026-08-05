import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminState } from "@/lib/auth/authorization";
import { getAllAnnouncements } from "@/lib/data/announcements";
import { StudioDashboard } from "./StudioDashboard";

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

  const announcementsResult = await getAllAnnouncements();
  const initialAnnouncements = announcementsResult.status === "ready" ? announcementsResult.data : [];

  return (
    <StudioDashboard adminEmail={admin.email} initialAnnouncements={initialAnnouncements} />
  );
}
