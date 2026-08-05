"use client";

import React from "react";
import { Database } from "@/lib/types/database";
import { useLanguage } from "@/components/providers/language-provider";
import { announcementPosterUrl } from "@/lib/data/announcements-client";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

interface AnnouncementListProps {
  announcements: Announcement[];
}

export default function AnnouncementList({ announcements }: AnnouncementListProps) {
  const { language } = useLanguage();

  if (announcements.length === 0) {
    return (
      <div className="state-card" style={{ textAlign: "center", padding: "3rem" }}>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          {language === "bm" ? "Tiada pengumuman diterbitkan." : "No announcements published."}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      {announcements.map((announcement) => {
        const title = language === "bm" ? announcement.title_bm : announcement.title_en;
        const body = language === "bm" ? announcement.body_bm : announcement.body_en;
        const posterUrl = announcementPosterUrl(announcement.poster_path);

        return (
          <article
            className="announcement-card"
            key={announcement.id}
            style={{
              display: "grid",
              // If poster exists, grid has 2 columns on desktop (from globals.css .announcement-card).
              // If poster is null, it displays beautifully with only 1 column because we omit poster_frame.
              gridTemplateColumns: posterUrl ? undefined : "1fr",
              gap: "1.5rem",
              padding: "1.5rem",
            }}
          >
            {posterUrl && (
              <div
                className="poster-frame"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background: "var(--surface-soft)",
                  borderRadius: "14px",
                  overflow: "hidden",
                  maxHeight: "450px",
                  width: "100%",
                }}
              >
                <img
                  src={posterUrl}
                  alt={`Poster: ${title}`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "450px",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span className="eyebrow" style={{ marginBottom: "0.5rem" }}>
                {announcement.category}
              </span>
              <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem", lineHeight: "1.2" }}>
                {title}
              </h2>
              <p style={{ whiteSpace: "pre-line", color: "var(--text)", margin: 0, opacity: 0.9 }}>
                {body}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
