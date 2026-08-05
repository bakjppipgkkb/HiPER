"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { announcementPosterUrl } from "@/lib/data/announcements-client";
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/features/announcements/actions";
import type { Database } from "@/lib/types/database";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

interface StudioDashboardProps {
  adminEmail: string | null;
  initialAnnouncements: Announcement[];
}

export function StudioDashboard({ adminEmail, initialAnnouncements }: StudioDashboardProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [activeTab, setActiveTab] = useState<"ringkasan" | "pengumuman">("pengumuman");

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Form fields
  const [titleBm, setTitleBm] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [bodyBm, setBodyBm] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [category, setCategory] = useState("Umum");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");

  // File upload state (Client-side)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPosterRemoved, setIsPosterRemoved] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Status & Validation error states
  const [isPending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Deletion state
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  // File Validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validate file extension
    const allowedExtensions = ["png", "jpg", "jpeg"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      setFileError("Format fail tidak disokong. Hanya PNG, JPG dan JPEG dibenarkan.");
      return;
    }

    // 2. Validate MIME type
    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedMimeTypes.includes(file.type)) {
      setFileError("Jenis fail tidak sah. Sila pilih fail gambar PNG, JPG atau JPEG.");
      return;
    }

    // 3. Validate file size (10 MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError("Fail melebihi had saiz 10 MB.");
      return;
    }

    setSelectedFile(file);
    setIsPosterRemoved(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
    setIsPosterRemoved(true);
  };

  // Open creation modal
  const handleCreateOpen = () => {
    setEditingAnnouncement(null);
    setTitleBm("");
    setTitleEn("");
    setBodyBm("");
    setBodyEn("");
    setCategory("Umum");
    setStatus("DRAFT");
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsPosterRemoved(false);
    setFileError(null);
    setFieldErrors({});
    setGeneralError(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
  };

  // Open edit modal
  const handleEditOpen = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setTitleBm(announcement.title_bm);
    setTitleEn(announcement.title_en);
    setBodyBm(announcement.body_bm);
    setBodyEn(announcement.body_en);
    setCategory(announcement.category);
    setStatus(announcement.status);
    setSelectedFile(null);
    setPreviewUrl(announcementPosterUrl(announcement.poster_path));
    setIsPosterRemoved(false);
    setFileError(null);
    setFieldErrors({});
    setGeneralError(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSuccessMessage(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.append("title_bm", titleBm);
    formData.append("title_en", titleEn);
    formData.append("body_bm", bodyBm);
    formData.append("body_en", bodyEn);
    formData.append("category", category);
    formData.append("status", status);

    if (selectedFile) {
      formData.append("poster_file", selectedFile);
    }
    if (isPosterRemoved) {
      formData.append("poster_removed", "true");
    }

    startTransition(async () => {
      let result;
      if (editingAnnouncement) {
        result = await updateAnnouncement(editingAnnouncement.id, null, formData);
      } else {
        result = await createAnnouncement(null, formData);
      }

      if (result.success && result.data) {
        setSuccessMessage(editingAnnouncement ? "Pengumuman berjaya dikemas kini!" : "Pengumuman berjaya dicipta!");

        // Update local state
        const savedAnnouncement = result.data as Announcement;
        if (editingAnnouncement) {
          setAnnouncements((prev) =>
            prev.map((item) => (item.id === savedAnnouncement.id ? savedAnnouncement : item))
          );
        } else {
          setAnnouncements((prev) => [savedAnnouncement, ...prev]);
        }

        setIsFormOpen(false);
      } else {
        if (result.validationErrors) {
          setFieldErrors(result.validationErrors);
        } else if (result.error) {
          setGeneralError(result.error);
        } else {
          setGeneralError("Ralat tidak dijangka berlaku.");
        }
      }
    });
  };

  // Handle Deletion Confirmation
  const handleDeleteConfirm = async () => {
    if (!announcementToDelete) return;

    startTransition(async () => {
      const result = await deleteAnnouncement(announcementToDelete.id);
      if (result.success) {
        setAnnouncements((prev) => prev.filter((item) => item.id !== announcementToDelete.id));
        setSuccessMessage("Pengumuman berjaya dipadam!");
        setAnnouncementToDelete(null);
      } else {
        setGeneralError(result.error || "Ralat tidak dijangka semasa memadam.");
        setAnnouncementToDelete(null);
      }
    });
  };

  return (
    <main className="studio-page">
      <aside className="studio-sidebar">
        <div className="brand">
          <img src="/hiper-mark.svg" alt="HiPER" />
          <span>
            <strong>HiPER Studio</strong>
            <small>{adminEmail}</small>
          </span>
        </div>
        <nav>
          <a
            href="#ringkasan"
            className={activeTab === "ringkasan" ? "active" : ""}
            onClick={() => setActiveTab("ringkasan")}
          >
            Ringkasan
          </a>
          <a
            href="#pengumuman"
            className={activeTab === "pengumuman" ? "active" : ""}
            onClick={() => setActiveTab("pengumuman")}
          >
            Pengumuman
          </a>
        </nav>
        <Link href="/auth/signout" className="button button--outline" style={{ marginTop: "auto" }}>
          Log keluar
        </Link>
      </aside>

      <section className="studio-content">
        {activeTab === "ringkasan" && (
          <div>
            <span className="eyebrow">Pentadbiran Am</span>
            <h1>Ringkasan HiPER Studio</h1>
            <p>Selamat datang ke portal pengurusan JPP IPGKKB. Sila pilih modul pengurusan di bahagian menu kiri.</p>
            <div className="studio-grid" style={{ marginTop: "2rem" }}>
              <div className="studio-panel">
                <h2>Jumlah Pengumuman</h2>
                <p style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--gold-500)", marginBlock: "0.5rem" }}>
                  {announcements.length}
                </p>
                <button className="button button--gold" onClick={() => setActiveTab("pengumuman")}>
                  Urus Pengumuman
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pengumuman" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span className="eyebrow">Sistem Pengumuman</span>
                <h1>Pengumuman</h1>
              </div>
              <button className="button button--gold" onClick={handleCreateOpen}>
                + Cipta Pengumuman
              </button>
            </div>

            {successMessage && (
              <div className="state-card" style={{ background: "rgba(40, 167, 69, 0.15)", border: "1px solid #28a745", borderRadius: "12px", padding: "1rem", marginBlock: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#2bec73", fontWeight: "bold" }}>{successMessage}</span>
                <button onClick={() => setSuccessMessage(null)} style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", fontSize: "1.2rem" }}>&times;</button>
              </div>
            )}

            {generalError && (
              <div className="state-card state-card--error" style={{ borderRadius: "12px", padding: "1rem", marginBlock: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--danger)", fontWeight: "bold" }}>{generalError}</span>
                <button onClick={() => setGeneralError(null)} style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", fontSize: "1.2rem" }}>&times;</button>
              </div>
            )}

            {isPending && (
              <div style={{ color: "var(--gold-300)", fontWeight: "bold", marginBlock: "1rem" }}>
                Sila tunggu, sedang diproses...
              </div>
            )}

            <div style={{ marginTop: "2rem" }}>
              {announcements.length === 0 ? (
                <div className="studio-panel" style={{ textAlign: "center", padding: "3rem" }}>
                  <p style={{ color: "var(--muted)" }}>Tiada rekod pengumuman ditemui.</p>
                </div>
              ) : (
                <div className="studio-panel" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                          <th style={{ padding: "1rem" }}>Tajuk (BM)</th>
                          <th style={{ padding: "1rem" }}>Kategori</th>
                          <th style={{ padding: "1rem" }}>Status</th>
                          <th style={{ padding: "1rem" }}>Tarikh Terbit</th>
                          <th style={{ padding: "1rem", textAlign: "right" }}>Tindakan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {announcements.map((item) => (
                          <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "1rem", fontWeight: "bold" }}>
                              {item.title_bm}
                              <div style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: "normal" }}>
                                {item.title_en}
                              </div>
                            </td>
                            <td style={{ padding: "1rem" }}>
                              <span style={{ background: "rgba(255,255,255,0.07)", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.85rem" }}>
                                {item.category}
                              </span>
                            </td>
                            <td style={{ padding: "1rem" }}>
                              <span
                                style={{
                                  padding: "0.2rem 0.5rem",
                                  borderRadius: "6px",
                                  fontSize: "0.85rem",
                                  fontWeight: "bold",
                                  background:
                                    item.status === "PUBLISHED"
                                      ? "rgba(40, 167, 69, 0.2)"
                                      : item.status === "DRAFT"
                                      ? "rgba(255, 193, 7, 0.2)"
                                      : "rgba(108, 117, 125, 0.2)",
                                  color:
                                    item.status === "PUBLISHED"
                                      ? "#2bec73"
                                      : item.status === "DRAFT"
                                      ? "#ffc107"
                                      : "#adb5bd",
                                }}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td style={{ padding: "1rem", fontSize: "0.9rem", color: "var(--muted)" }}>
                              {item.published_at ? new Date(item.published_at).toLocaleDateString("ms-MY") : "-"}
                            </td>
                            <td style={{ padding: "1rem", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                <button className="button button--outline" style={{ minHeight: "36px", padding: "0.4rem 0.8rem", borderRadius: "8px", fontSize: "0.85rem" }} onClick={() => handleEditOpen(item)}>
                                  Edit
                                </button>
                                <button className="button" style={{ minHeight: "36px", padding: "0.4rem 0.8rem", borderRadius: "8px", fontSize: "0.85rem", background: "var(--danger)", color: "#fff" }} onClick={() => setAnnouncementToDelete(item)}>
                                  Padam
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Modal Borang Pengumuman */}
      {isFormOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "grid", placeItems: "center", zIndex: 100, padding: "1rem", overflowY: "auto" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "720px", padding: "2rem", boxShadow: "0 30px 90px rgba(0,0,0,0.5)", position: "relative" }}>
            <button onClick={() => setIsFormOpen(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: 0, color: "var(--text)", fontSize: "2rem", cursor: "pointer", padding: "0.2rem" }}>&times;</button>

            <h2>{editingAnnouncement ? "Edit Pengumuman" : "Cipta Pengumuman Baru"}</h2>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.2rem", marginTop: "1.5rem" }}>

              {/* Status Field */}
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)" }}
                >
                  <option value="DRAFT" style={{ background: "var(--paper)" }}>DRAFT</option>
                  <option value="PUBLISHED" style={{ background: "var(--paper)" }}>PUBLISHED</option>
                  <option value="ARCHIVED" style={{ background: "var(--paper)" }}>ARCHIVED</option>
                </select>
                {fieldErrors.status && <p style={{ color: "#ffb4bf", fontSize: "0.85rem", marginTop: "0.2rem" }}>{fieldErrors.status}</p>}
              </div>

              {/* Category Field */}
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>Kategori</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Contoh: Umum, Hebahan, Aktiviti"
                  style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                {fieldErrors.category && <p style={{ color: "#ffb4bf", fontSize: "0.85rem", marginTop: "0.2rem" }}>{fieldErrors.category}</p>}
              </div>

              {/* Title BM */}
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>Tajuk (Bahasa Melayu)</label>
                <input
                  type="text"
                  value={titleBm}
                  onChange={(e) => setTitleBm(e.target.value)}
                  placeholder="Tajuk pengumuman dalam BM"
                  style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                {fieldErrors.title_bm && <p style={{ color: "#ffb4bf", fontSize: "0.85rem", marginTop: "0.2rem" }}>{fieldErrors.title_bm}</p>}
              </div>

              {/* Title EN */}
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>Tajuk (English)</label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Announcement title in English"
                  style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                {fieldErrors.title_en && <p style={{ color: "#ffb4bf", fontSize: "0.85rem", marginTop: "0.2rem" }}>{fieldErrors.title_en}</p>}
              </div>

              {/* Body BM */}
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>Kandungan (Bahasa Melayu)</label>
                <textarea
                  rows={4}
                  value={bodyBm}
                  onChange={(e) => setBodyBm(e.target.value)}
                  placeholder="Kandungan penuh dalam BM"
                  style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)", resize: "vertical" }}
                />
                {fieldErrors.body_bm && <p style={{ color: "#ffb4bf", fontSize: "0.85rem", marginTop: "0.2rem" }}>{fieldErrors.body_bm}</p>}
              </div>

              {/* Body EN */}
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>Kandungan (English)</label>
                <textarea
                  rows={4}
                  value={bodyEn}
                  onChange={(e) => setBodyEn(e.target.value)}
                  placeholder="Full content in English"
                  style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)", resize: "vertical" }}
                />
                {fieldErrors.body_en && <p style={{ color: "#ffb4bf", fontSize: "0.85rem", marginTop: "0.2rem" }}>{fieldErrors.body_en}</p>}
              </div>

              {/* Poster Upload Section */}
              <div style={{ border: "1px dashed var(--border)", borderRadius: "12px", padding: "1.2rem", background: "rgba(0,0,0,0.15)" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Poster Pengumuman (Opsional)</label>

                {previewUrl ? (
                  <div style={{ display: "grid", gap: "0.8rem" }}>
                    <div style={{ maxWidth: "300px", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border)", background: "#fff", display: "flex", justifyContent: "center" }}>
                      <img src={previewUrl} alt="Poster preview" style={{ width: "100%", height: "auto", objectFit: "contain", maxHeight: "300px" }} />
                    </div>
                    <button type="button" className="button" style={{ background: "var(--danger)", color: "#fff", padding: "0.4rem 0.8rem", minHeight: "36px", fontSize: "0.85rem", justifySelf: "start" }} onClick={removeSelectedFile}>
                      Buang Gambar
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                      style={{ display: "block", width: "100%", fontSize: "0.9rem", color: "var(--text)" }}
                    />
                    <small style={{ display: "block", marginTop: "0.4rem", color: "var(--muted)" }}>
                      Sokongan format: PNG, JPG, JPEG sahaja (Max 10 MB).
                    </small>
                  </div>
                )}

                {fileError && <p style={{ color: "#ffb4bf", fontSize: "0.85rem", marginTop: "0.4rem", fontWeight: "bold" }}>{fileError}</p>}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" className="button button--outline" onClick={() => setIsFormOpen(false)} disabled={isPending}>
                  Batal
                </button>
                <button type="submit" className="button button--gold" disabled={isPending || !!fileError}>
                  {isPending ? "Sedang Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sahkan Padam */}
      {announcementToDelete && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "grid", placeItems: "center", zIndex: 110, padding: "1rem" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "500px", padding: "2rem", boxShadow: "0 30px 90px rgba(0,0,0,0.5)", textAlign: "center" }}>
            <h2>Padam Pengumuman?</h2>
            <p style={{ marginBlock: "1rem", color: "var(--muted)" }}>
              Adakah anda pasti mahu memadam pengumuman <strong>&quot;{announcementToDelete.title_bm}&quot;</strong>? Tindakan ini tidak boleh diundurkan.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
              <button className="button button--outline" onClick={() => setAnnouncementToDelete(null)} disabled={isPending}>
                Batal
              </button>
              <button className="button" style={{ background: "var(--danger)", color: "#fff" }} onClick={handleDeleteConfirm} disabled={isPending}>
                {isPending ? "Sedang Memadam..." : "Ya, Padam"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .studio-sidebar nav a.active {
          background: #421326;
          color: var(--gold-300);
          font-weight: bold;
        }
      `}</style>
    </main>
  );
}
