import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminState } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/types/database";
import StudioDashboard from "./StudioDashboard";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const admin = await getAdminState();
  if (admin.status === "anonymous") redirect("/studio/login");

  if (admin.status === "unconfigured") {
    return (
      <main className="studio-page">
        <div className="studio-panel">
          <h1>Supabase belum dikonfigurasi</h1>
          <p>Ikuti docs/SUPABASE_SETUP.md dahulu.</p>
        </div>
      </main>
    );
  }

  if (admin.status === "forbidden") {
    return (
      <main className="studio-page">
        <div className="studio-panel">
          <h1>Akses pentadbir diperlukan</h1>
          <p>{admin.email ?? "Akaun ini"} belum mempunyai peranan ADMIN.</p>
          <Link href="/auth/signout" className="button button--outline">
            Log keluar
          </Link>
        </div>
      </main>
    );
  }

  // Fetch real announcements from Supabase
  const supabase = await createClient();
  let initialAnnouncements: Announcement[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    initialAnnouncements = (data as Announcement[]) ?? [];
  }

  return (
    <StudioDashboard
      initialAnnouncements={initialAnnouncements}
      adminEmail={admin.email}
    />
  );
}
