import Image from "next/image";
import { announcementPosterUrl, getPublishedAnnouncements } from "@/lib/data/announcements";
import { DataError, EmptyState, SetupRequired } from "@/components/ui/data-state";

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
        {result.status === "ready" && result.data.length === 0 && <EmptyState>Tiada pengumuman diterbitkan.</EmptyState>}
        <div className="stack">
          {result.data.map((announcement) => {
            const posterUrl = announcementPosterUrl(announcement.poster_path);
            return (
              <article className="announcement-card" key={announcement.id}>
                {posterUrl && <div className="poster-frame"><Image src={posterUrl} alt={`Poster: ${announcement.title_bm}`} width={1200} height={1600} sizes="(max-width: 720px) 100vw, 360px" /></div>}
                <div><span className="eyebrow">{announcement.category}</span><h2>{announcement.title_bm}</h2><p>{announcement.body_bm}</p></div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
