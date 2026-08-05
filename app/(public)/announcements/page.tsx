import { getPublishedAnnouncements } from "@/lib/data/announcements";
import { DataError, SetupRequired } from "@/components/ui/data-state";
import AnnouncementList from "./AnnouncementList";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const result = await getPublishedAnnouncements();

  return (
    <section className="section">
      <div className="container container--narrow">
        <span className="eyebrow">Arkib rasmi perbendaharaan</span>
        <h1>Pengumuman</h1>

        {result.status === "unconfigured" && <SetupRequired />}
        {result.status === "error" && <DataError message={result.message} />}
        {result.status === "ready" && (
          <AnnouncementList announcements={result.data} />
        )}
      </div>
    </section>
  );
}
