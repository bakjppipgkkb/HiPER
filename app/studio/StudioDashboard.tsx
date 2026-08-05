"use client";

import React, { useState, useTransition, useRef } from "react";
import { Database } from "@/lib/types/database";
import { announcementPosterUrl } from "@/lib/data/announcements-client";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
  uploadPosterAction,
} from "@/features/announcements/actions";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

interface StudioDashboardProps {
  initialAnnouncements: Announcement[];
  adminEmail: string | null;
}

export default function StudioDashboard({
  initialAnnouncements,
  adminEmail,
}: StudioDashboardProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(
    initialAnnouncements
  );
  const [isPending, startTransition] = useTransition();

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [titleBm, setTitleBm] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [bodyBm, setBodyBm] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [category, setCategory] = useState("Umum");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [posterPath, setPosterPath] = useState<string | null>(null);

  // Message & Error states
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});

  // Poster Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Helper to trigger messages
  const triggerMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      setMessage((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  };

  // Reset Form fields
  const resetForm = () => {
    setTitleBm("");
    setTitleEn("");
    setBodyBm("");
    setBodyEn("");
    setCategory("Umum");
    setStatus("DRAFT");
    setPosterPath(null);
    setValidationErrors({});
    setUploadError(null);
    setEditingId(null);
    setIsFormOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle Edit click
  const handleEditClick = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setTitleBm(announcement.title_bm);
    setTitleEn(announcement.title_en);
    setBodyBm(announcement.body_bm);
    setBodyEn(announcement.body_en);
    setCategory(announcement.category);
    setStatus(announcement.status);
    setPosterPath(announcement.poster_path);
    setValidationErrors({});
    setUploadError(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle Poster File Upload
  const handlePosterChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Client-side validations
    // 1. Extension check
    const allowedExtensions = ["png", "jpg", "jpeg"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedExtensions.includes(ext)) {
      setUploadError("Hanya fail format PNG, JPG atau JPEG sahaja dibenarkan.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. MIME type check
    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedMimeTypes.includes(file.type)) {
      setUploadError("Jenis MIME tidak sah. Hanya PNG dan JPEG sahaja dibenarkan.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 3. Size check (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("Ukuran fail melebihi had maksimum 10 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Upload using Server Action
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadPosterAction(formData);

      if (result.status === "error") {
        setUploadError(result.message);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else if (result.status === "success") {
        setPosterPath(result.poster_path);
        triggerMessage("Poster berjaya dimuat naik.", "success");
      }
    } catch {
      setUploadError("Ralat sistem ketika memuat naik poster.");
    } finally {
      setIsUploading(false);
    }
  };

  // Remove uploaded poster path from form state (doesn't delete immediately, cleanup happens on save/edit)
  const handleRemovePoster = () => {
    setPosterPath(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Save / Update Form Submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setMessage(null);

    const payload = {
      title_bm: titleBm,
      title_en: titleEn,
      body_bm: bodyBm,
      body_en: bodyEn,
      category,
      status,
      poster_path: posterPath,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          // Update
          const result = await updateAnnouncementAction(editingId, payload);
          if (result.status === "validation_error") {
            setValidationErrors(result.errors || {});
            triggerMessage(result.message, "error");
          } else if (result.status === "error") {
            triggerMessage(result.message, "error");
          } else if (result.status === "success") {
            setAnnouncements((prev) =>
              prev.map((a) => (a.id === editingId ? (result.data as Announcement) : a))
            );
            triggerMessage("Pengumuman berjaya dikemaskini.", "success");
            resetForm();
          }
        } else {
          // Create
          const result = await createAnnouncementAction(payload);
          if (result.status === "validation_error") {
            setValidationErrors(result.errors || {});
            triggerMessage(result.message, "error");
          } else if (result.status === "error") {
            triggerMessage(result.message, "error");
          } else if (result.status === "success") {
            setAnnouncements((prev) => [result.data as Announcement, ...prev]);
            triggerMessage("Pengumuman berjaya dicipta.", "success");
            resetForm();
          }
        }
      } catch {
        triggerMessage("Berlaku ralat sistem yang tidak dijangka.", "error");
      }
    });
  };

  // Confirm and delete announcement
  const handleDeleteConfirm = async (id: string) => {
    setDeletingId(null);
    startTransition(async () => {
      try {
        const result = await deleteAnnouncementAction(id);
        if (result.status === "error") {
          triggerMessage(result.message, "error");
        } else {
          setAnnouncements((prev) => prev.filter((a) => a.id !== id));
          triggerMessage("Pengumuman berjaya dipadam.", "success");
        }
      } catch {
        triggerMessage("Gagal memadam pengumuman.", "error");
      }
    });
  };

  return (
    <main className="studio-page">
      {/* Sidebar navigation */}
      <aside className="studio-sidebar">
        <div className="brand">
          <img src="/hiper-mark.svg" alt="HiPER" />
          <span>
            <strong>HiPER Studio</strong>
            <small>{adminEmail}</small>
          </span>
        </div>
        <nav>
          <a href="#senarai" className="active">
            📣 Pengumuman
          </a>
          <a href="/studio">🏠 Halaman Utama</a>
        </nav>
        <a href="/auth/signout" className="button button--outline">
          Log keluar
        </a>
      </aside>

      {/* Main Content Area */}
      <section className="studio-content">
        <span className="eyebrow">Menguruskan Hebahan & Info</span>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <h1 style={{ margin: 0 }}>Pengumuman JPP</h1>
          {!isFormOpen && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="button button--gold"
            >
              ➕ Tambah Pengumuman
            </button>
          )}
        </div>

        {/* Global Action feedback message */}
        {message && (
          <div
            className={`state-card ${
              message.type === "error" ? "state-card--error" : ""
            }`}
            style={{
              padding: "1rem",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              background: message.type === "error" ? "#461326" : "#1b351d",
              borderColor: message.type === "error" ? "#a6293b" : "#2d6a3f",
              color: "#fff",
            }}
          >
            <strong>
              {message.type === "error" ? "⚠️ Ralat: " : "✅ Berjaya: "}
            </strong>
            <span>{message.text}</span>
          </div>
        )}

        {/* Create / Edit Form Section */}
        {isFormOpen && (
          <div
            className="studio-panel"
            style={{ marginBottom: "2rem", padding: "1.5rem" }}
          >
            <h2 style={{ color: "var(--gold-300)", marginBottom: "1rem" }}>
              {editingId ? "✏️ Kemaskini Pengumuman" : "📝 Pengumuman Baharu"}
            </h2>

            <form onSubmit={handleFormSubmit} className="stack" style={{ marginTop: 0 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem" }}>
                    Tajuk (BM) <span style={{ color: "var(--gold-300)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={titleBm}
                    onChange={(e) => setTitleBm(e.target.value)}
                    placeholder="Contoh: Pendaftaran Ahli Baharu JPP"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      background: "var(--surface-soft)",
                      border: "1px solid var(--border)",
                      color: "inherit",
                    }}
                    required
                  />
                  {validationErrors.title_bm && (
                    <span className="form-error" style={{ fontSize: "0.85rem" }}>
                      {validationErrors.title_bm[0]}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem" }}>
                    Tajuk (EN) <span style={{ color: "var(--gold-300)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="Contoh: New JPP Member Registration"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      background: "var(--surface-soft)",
                      border: "1px solid var(--border)",
                      color: "inherit",
                    }}
                    required
                  />
                  {validationErrors.title_en && (
                    <span className="form-error" style={{ fontSize: "0.85rem" }}>
                      {validationErrors.title_en[0]}
                    </span>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem" }}>
                    Kandungan (BM) <span style={{ color: "var(--gold-300)" }}>*</span>
                  </label>
                  <textarea
                    rows={6}
                    value={bodyBm}
                    onChange={(e) => setBodyBm(e.target.value)}
                    placeholder="Tulis hebahan lengkap anda dalam Bahasa Melayu..."
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      background: "var(--surface-soft)",
                      border: "1px solid var(--border)",
                      color: "inherit",
                      resize: "vertical",
                    }}
                    required
                  />
                  {validationErrors.body_bm && (
                    <span className="form-error" style={{ fontSize: "0.85rem" }}>
                      {validationErrors.body_bm[0]}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem" }}>
                    Kandungan (EN) <span style={{ color: "var(--gold-300)" }}>*</span>
                  </label>
                  <textarea
                    rows={6}
                    value={bodyEn}
                    onChange={(e) => setBodyEn(e.target.value)}
                    placeholder="Write your complete announcement in English..."
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      background: "var(--surface-soft)",
                      border: "1px solid var(--border)",
                      color: "inherit",
                      resize: "vertical",
                    }}
                    required
                  />
                  {validationErrors.body_en && (
                    <span className="form-error" style={{ fontSize: "0.85rem" }}>
                      {validationErrors.body_en[0]}
                    </span>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem" }}>
                    Kategori <span style={{ color: "var(--gold-300)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Akademik, Kebajikan, Sukan, Umum..."
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      background: "var(--surface-soft)",
                      border: "1px solid var(--border)",
                      color: "inherit",
                    }}
                    required
                  />
                  {validationErrors.category && (
                    <span className="form-error" style={{ fontSize: "0.85rem" }}>
                      {validationErrors.category[0]}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem" }}>
                    Status Penerbitan <span style={{ color: "var(--gold-300)" }}>*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED")
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      background: "var(--surface-soft)",
                      border: "1px solid var(--border)",
                      color: "inherit",
                    }}
                  >
                    <option value="DRAFT">DRAFT (Simpan Sahaja)</option>
                    <option value="PUBLISHED">PUBLISHED (Terbitkan Terus)</option>
                    <option value="ARCHIVED">ARCHIVED (Arkibkan)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem" }}>
                    Poster Pengumuman
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePosterChange}
                    accept=".png,.jpg,.jpeg"
                    style={{ display: "none" }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="button button--outline"
                      style={{ flex: 1, minHeight: "44px" }}
                      disabled={isUploading}
                    >
                      {isUploading ? "Memuat naik..." : "📁 Pilih Fail"}
                    </button>
                    {posterPath && (
                      <button
                        type="button"
                        onClick={handleRemovePoster}
                        className="button"
                        style={{
                          background: "var(--danger)",
                          color: "#fff",
                          minHeight: "44px",
                        }}
                      >
                        Padam
                      </button>
                    )}
                  </div>
                  <small style={{ display: "block", marginTop: "0.25rem", opacity: 0.7 }}>
                    Format PNG/JPG/JPEG sahaja. Had 10MB.
                  </small>
                  {uploadError && (
                    <span className="form-error" style={{ fontSize: "0.85rem" }}>
                      {uploadError}
                    </span>
                  )}
                </div>
              </div>

              {/* Poster Preview Frame */}
              {posterPath && (
                <div style={{ marginTop: "1rem" }}>
                  <span style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                    Pratonton Poster:
                  </span>
                  <div
                    className="poster-frame"
                    style={{
                      maxWidth: "240px",
                      border: "1px solid var(--border)",
                      padding: "4px",
                    }}
                  >
                    <img
                      src={announcementPosterUrl(posterPath) || ""}
                      alt="Pratonton poster"
                      style={{ width: "100%", height: "auto", display: "block" }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "1rem",
                  marginTop: "1.5rem",
                  borderTop: "1px solid var(--border)",
                  paddingTop: "1.5rem",
                }}
              >
                <button
                  type="button"
                  onClick={resetForm}
                  className="button button--outline"
                  disabled={isPending}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="button button--gold"
                  disabled={isPending || isUploading}
                >
                  {isPending ? "Menyimpan..." : "💾 Simpan Rekod"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Confirmation Modal State */}
        {deletingId && (
          <div
            style={{
              background: "#461326",
              border: "2px solid var(--danger)",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "2rem",
              color: "#fff",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#ffb4bf" }}>
              ⚠️ Padam Pengumuman?
            </h3>
            <p>
              Adakah anda benar-benar pasti mahu memadam pengumuman ini?
              Tindakan ini juga akan memadam fail poster yang berkaitan dan tidak
              boleh diundurkan.
            </p>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.25rem" }}>
              <button
                onClick={() => handleDeleteConfirm(deletingId)}
                className="button"
                style={{ background: "var(--danger)", color: "#fff" }}
                disabled={isPending}
              >
                Ya, Padamkan
              </button>
              <button
                onClick={() => setDeletingId(null)}
                className="button button--outline"
                disabled={isPending}
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Announcement list grid */}
        <div className="studio-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>
            📋 Senarai Pengumuman Semasa ({announcements.length})
          </h2>

          {announcements.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
              Tiada rekod pengumuman ditemui. Klik butang di atas untuk menambah pengumuman baharu.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "1rem",
              }}
            >
              {announcements.map((announcement) => {
                const posterUrl = announcementPosterUrl(announcement.poster_path);
                return (
                  <div
                    key={announcement.id}
                    className="record-row"
                    style={{
                      background: "var(--surface-soft)",
                      borderRadius: "12px",
                      padding: "1rem",
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      {posterUrl ? (
                        <div
                          className="poster-frame"
                          style={{
                            width: "60px",
                            height: "60px",
                            flexShrink: 0,
                            borderRadius: "6px",
                          }}
                        >
                          <img
                            src={posterUrl}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "6px",
                            background: "var(--border)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: "1.2rem",
                          }}
                        >
                          📝
                        </div>
                      )}

                      <div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                              background:
                                announcement.status === "PUBLISHED"
                                  ? "#1b351d"
                                  : announcement.status === "DRAFT"
                                  ? "#333"
                                  : "#461326",
                              color:
                                announcement.status === "PUBLISHED"
                                  ? "#c3e6cb"
                                  : "#fff",
                            }}
                          >
                            {announcement.status}
                          </span>
                          <span style={{ fontSize: "0.8rem", color: "var(--gold-300)" }}>
                            {announcement.category}
                          </span>
                        </div>
                        <h4 style={{ margin: "4px 0 0 0", fontSize: "1.1rem" }}>
                          {announcement.title_bm}
                        </h4>
                        <small style={{ color: "var(--muted)" }}>
                          {announcement.title_en}
                        </small>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleEditClick(announcement)}
                        className="button button--outline"
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.9rem", minHeight: "36px" }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setDeletingId(announcement.id)}
                        className="button"
                        style={{
                          background: "var(--danger)",
                          color: "#fff",
                          padding: "0.4rem 0.8rem",
                          fontSize: "0.9rem",
                          minHeight: "36px",
                        }}
                      >
                        🗑️ Padam
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
