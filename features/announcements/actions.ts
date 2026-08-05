"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminState } from "@/lib/auth/authorization";
import { Json } from "@/lib/types/database";

export const announcementFormSchema = z.object({
  title_bm: z.string()
    .trim()
    .min(1, "Tajuk (BM) wajib diisi")
    .max(180, "Tajuk (BM) tidak boleh melebihi 180 aksara"),
  title_en: z.string()
    .trim()
    .min(1, "Tajuk (EN) wajib diisi")
    .max(180, "Tajuk (EN) tidak boleh melebihi 180 aksara"),
  body_bm: z.string()
    .trim()
    .min(1, "Kandungan (BM) wajib diisi")
    .max(10000, "Kandungan (BM) tidak boleh melebihi 10,000 aksara"),
  body_en: z.string()
    .trim()
    .min(1, "Kandungan (EN) wajib diisi")
    .max(10000, "Kandungan (EN) tidak boleh melebihi 10,000 aksara"),
  category: z.string()
    .trim()
    .min(1, "Kategori wajib diisi")
    .max(80, "Kategori tidak boleh melebihi 80 aksara"),
  poster_path: z.string().trim().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  published_at: z.string().nullable().optional(),
});

export async function uploadPosterAction(formData: FormData) {
  // 1. Authorize ADMIN
  const admin = await getAdminState();
  if (admin.status !== "authorized") {
    return { status: "error" as const, message: "Akses dinafikan: Perlu log masuk sebagai pentadbir." };
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return { status: "error" as const, message: "Tiada fail dimuat naik." };
  }

  // 2. Validate Size (10 MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { status: "error" as const, message: "Ukuran fail melebihi had maksimum 10 MB." };
  }

  // 3. Validate Extension and MIME type
  const allowedExtensions = ["png", "jpg", "jpeg"];
  const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];

  const fileName = file.name || "";
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext || !allowedExtensions.includes(ext)) {
    return { status: "error" as const, message: "Hanya fail format PNG, JPG atau JPEG sahaja dibenarkan." };
  }

  if (!allowedMimeTypes.includes(file.type)) {
    return { status: "error" as const, message: "Jenis MIME tidak sah. Hanya PNG dan JPEG sahaja dibenarkan." };
  }

  // 4. Generate Safe Random Filename
  const safeFilename = `${crypto.randomUUID()}.${ext}`;

  // 5. Upload to Supabase Storage
  const supabase = await createClient();
  if (!supabase) {
    return { status: "error" as const, message: "Sistem pangkalan data belum bersedia." };
  }

  const fileBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from("announcement-posters")
    .upload(safeFilename, new Blob([fileBuffer]), {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return { status: "error" as const, message: `Gagal memuat naik poster: ${error.message}` };
  }

  return { status: "success" as const, poster_path: safeFilename };
}

export async function deletePosterAction(posterPath: string) {
  const admin = await getAdminState();
  if (admin.status !== "authorized") {
    return { status: "error" as const, message: "Akses dinafikan: Hanya pentadbir aktif sahaja dibenarkan." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { status: "error" as const, message: "Sistem pangkalan data belum bersedia." };
  }

  const { error } = await supabase.storage
    .from("announcement-posters")
    .remove([posterPath]);

  if (error) {
    return { status: "error" as const, message: `Gagal memadam poster: ${error.message}` };
  }

  return { status: "success" as const };
}

export async function createAnnouncementAction(data: unknown) {
  const admin = await getAdminState();
  if (admin.status !== "authorized") {
    return { status: "error" as const, message: "Akses dinafikan: Hanya pentadbir aktif sahaja dibenarkan." };
  }

  const parsed = announcementFormSchema.safeParse(data);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0] || "Maklumat tidak sah.";
    return { status: "validation_error" as const, message: firstError, errors };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { status: "error" as const, message: "Sistem pangkalan data belum bersedia." };
  }

  let published_at = parsed.data.published_at || null;
  if (parsed.data.status === "PUBLISHED" && !published_at) {
    published_at = new Date().toISOString();
  }

  const insertData = {
    title_bm: parsed.data.title_bm,
    title_en: parsed.data.title_en,
    body_bm: parsed.data.body_bm,
    body_en: parsed.data.body_en,
    category: parsed.data.category,
    poster_path: parsed.data.poster_path || null,
    status: parsed.data.status,
    published_at,
    created_by: admin.userId,
  };

  const { data: newRecord, error } = await supabase
    .from("announcements")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return { status: "error" as const, message: `Gagal mencipta pengumuman: ${error.message}` };
  }

  // Audit Log
  await supabase.from("audit_log").insert({
    actor_id: admin.userId,
    action: "CREATE",
    entity_type: "announcement",
    entity_id: newRecord.id,
    after_data: newRecord as unknown as Json,
  });

  revalidatePath("/announcements");
  revalidatePath("/studio");

  return { status: "success" as const, data: newRecord };
}

export async function updateAnnouncementAction(id: string, data: unknown) {
  const admin = await getAdminState();
  if (admin.status !== "authorized") {
    return { status: "error" as const, message: "Akses dinafikan: Hanya pentadbir aktif sahaja dibenarkan." };
  }

  const parsed = announcementFormSchema.safeParse(data);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0] || "Maklumat tidak sah.";
    return { status: "validation_error" as const, message: firstError, errors };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { status: "error" as const, message: "Sistem pangkalan data belum bersedia." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return { status: "error" as const, message: "Pengumuman tidak ditemui." };
  }

  let published_at = parsed.data.published_at || existing.published_at;
  if (parsed.data.status === "PUBLISHED" && !published_at) {
    published_at = new Date().toISOString();
  } else if (parsed.data.status !== "PUBLISHED") {
    published_at = null;
  }

  const updateData = {
    title_bm: parsed.data.title_bm,
    title_en: parsed.data.title_en,
    body_bm: parsed.data.body_bm,
    body_en: parsed.data.body_en,
    category: parsed.data.category,
    poster_path: parsed.data.poster_path || null,
    status: parsed.data.status,
    published_at,
  };

  const { data: updatedRecord, error } = await supabase
    .from("announcements")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { status: "error" as const, message: `Gagal mengemaskini pengumuman: ${error.message}` };
  }

  // Clean up replaced/removed poster safely
  if (existing.poster_path && existing.poster_path !== updatedRecord.poster_path) {
    await supabase.storage.from("announcement-posters").remove([existing.poster_path]);
  }

  // Audit Log
  await supabase.from("audit_log").insert({
    actor_id: admin.userId,
    action: "UPDATE",
    entity_type: "announcement",
    entity_id: id,
    before_data: existing as unknown as Json,
    after_data: updatedRecord as unknown as Json,
  });

  revalidatePath("/announcements");
  revalidatePath("/studio");

  return { status: "success" as const, data: updatedRecord };
}

export async function deleteAnnouncementAction(id: string) {
  const admin = await getAdminState();
  if (admin.status !== "authorized") {
    return { status: "error" as const, message: "Akses dinafikan: Hanya pentadbir aktif sahaja dibenarkan." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { status: "error" as const, message: "Sistem pangkalan data belum bersedia." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return { status: "error" as const, message: "Pengumuman tidak ditemui." };
  }

  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) {
    return { status: "error" as const, message: `Gagal memadam pengumuman: ${error.message}` };
  }

  // Clean up poster safely
  if (existing.poster_path) {
    await supabase.storage.from("announcement-posters").remove([existing.poster_path]);
  }

  // Audit Log
  await supabase.from("audit_log").insert({
    actor_id: admin.userId,
    action: "DELETE",
    entity_type: "announcement",
    entity_id: id,
    before_data: existing as unknown as Json,
  });

  revalidatePath("/announcements");
  revalidatePath("/studio");

  return { status: "success" as const };
}
