import Image from "next/image";
import { cookies } from "next/headers";
import { announcementPosterUrl, getPublishedAnnouncements } from "@/lib/data/announcements";
import { DataError, EmptyState, SetupRequired } from "@/components/ui/data-state";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const cookieStore = await cookies();
  const language = cookieStore.get("hiper-language")?.value === "en" ? "en" : "bm";

  const result = await getPublishedAnnouncements();

  return (
    <section className="section">
      <div className="container container--narrow">
        <span className="eyebrow">
          {language === "en" ? "Digital Treasury Official Announcements" : "Arkib rasmi perbendaharaan"}
        </span>
        <h1>{language === "en" ? "Announcements" : "Pengumuman"}</h1>

        {result.status === "unconfigured" && <SetupRequired />}
        {result.status === "error" && <DataError message={result.message} />}
        {result.status === "ready" && result.data.length === 0 && (
          <EmptyState>
            {language === "en" ? "No published announcements found." : "Tiada pengumuman diterbitkan."}
          </EmptyState>
        )}

        {result.status === "ready" && result.data.length > 0 && (
          <div className="stack">
            {result.data.map((announcement) => {
              const posterUrl = announcementPosterUrl(announcement.poster_path);
              const title = language === "en" ? announcement.title_en : announcement.title_bm;
              const body = language === "en" ? announcement.body_en : announcement.body_bm;

              const hasPoster = !!posterUrl;

              const formattedDate = announcement.published_at
                ? new Date(announcement.published_at).toLocaleDateString(
                    language === "en" ? "en-US" : "ms-MY",
                    { day: "numeric", month: "long", year: "numeric" }
                  )
                : null;

              return (
                <article
                  className="announcement-card"
                  key={announcement.id}
                  style={{ gridTemplateColumns: hasPoster ? undefined : "1fr" }}
                >
                  {hasPoster && (
                    <div className="poster-frame" style={{ display: "flex", justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.05)" }}>
                      <Image
                        src={posterUrl}
                        alt={language === "en" ? `Poster: ${announcement.title_en}` : `Poster: ${announcement.title_bm}`}
                        width={600}
                        height={800}
                        sizes="(max-width: 720px) 100vw, 320px"
                        style={{ width: "100%", height: "auto", objectFit: "contain", maxHeight: "400px" }}
                      />
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <span className="eyebrow" style={{ display: "inline-block", marginBottom: "0.5rem" }}>
                        {announcement.category}
                      </span>
                      <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>{title}</h2>
                      <p style={{ whiteSpace: "pre-wrap", color: "var(--text)", opacity: 0.9 }}>{body}</p>
                    </div>

                    {formattedDate && (
                      <span style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "1.5rem" }}>
                        {language === "en" ? "Published on: " : "Diterbitkan pada: "}
                        <strong>{formattedDate}</strong>
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
