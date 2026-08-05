"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminState } from "@/lib/auth/authorization";
import { Json } from "@/lib/types/database";
import { announcementFormSchema } from "./schema";

// Internal, non-exported validator for poster storage paths
function validatePosterPath(path: string | null | undefined): boolean {
  if (!path) return true; // Null/empty is valid (text-only)

  // Only accept UUID format with .png, .jpg, or .jpeg extension
  const uuidWithExtRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|jpeg)$/i;

  // Ensures no slashes, backslashes, ".." and strict UUID pattern
  return uuidWithExtRegex.test(path);
}

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

  // Read and validate file signatures (magic bytes)
  const fileBuffer = await file.arrayBuffer();
  const uint8View = new Uint8Array(fileBuffer);

  // Check PNG Signature: 89 50 4E 47 0D 0A 1A 0A
  const isPngSignature = uint8View.length >= 8 &&
    uint8View[0] === 0x89 &&
    uint8View[1] === 0x50 &&
    uint8View[2] === 0x4E &&
    uint8View[3] === 0x47 &&
    uint8View[4] === 0x0D &&
    uint8View[5] === 0x0A &&
    uint8View[6] === 0x1A &&
    uint8View[7] === 0x0A;

  // Check JPEG Signature: FF D8 FF
  const isJpegSignature = uint8View.length >= 3 &&
    uint8View[0] === 0xFF &&
    uint8View[1] === 0xD8 &&
    uint8View[2] === 0xFF;

  if (isPngSignature) {
    if (ext !== "png") {
      return { status: "error" as const, message: "Sambungan fail tidak sepadan dengan tandatangan imej PNG." };
    }
    if (file.type !== "image/png") {
      return { status: "error" as const, message: "Jenis MIME tidak sepadan dengan tandatangan imej PNG." };
    }
  } else if (isJpegSignature) {
    if (ext !== "jpg" && ext !== "jpeg") {
      return { status: "error" as const, message: "Sambungan fail tidak sepadan dengan tandatangan imej JPEG." };
    }
    if (file.type !== "image/jpeg" && file.type !== "image/jpg") {
      return { status: "error" as const, message: "Jenis MIME tidak sepadan dengan tandatangan imej JPEG." };
    }
  } else {
    return { status: "error" as const, message: "Tandatangan fail tidak sah. Hanya fail imej PNG dan JPEG yang sebenar sahaja dibenarkan." };
  }

  // Use the MIME type verified from the actual file signature.
  const detectedMimeType = isPngSignature ? "image/png" : "image/jpeg";

  // 4. Generate Safe Random Filename
  const safeFilename = `${crypto.randomUUID()}.${ext}`;

  // 5. Upload to Supabase Storage
  const supabase = await createClient();
  if (!supabase) {
    return { status: "error" as const, message: "Sistem pangkalan data belum bersedia." };
  }

  const { error } = await supabase.storage
    .from("announcement-posters")
    .upload(safeFilename, uint8View, {
      contentType: detectedMimeType,
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

  // Validate the poster path
  if (!validatePosterPath(posterPath)) {
    return { status: "error" as const, message: "Nama fail poster tidak sah." };
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

  // Validate poster path format
  if (!validatePosterPath(parsed.data.poster_path)) {
    return { status: "error" as const, message: "Format nama fail poster tidak sah." };
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

  // Validate poster path format
  if (!validatePosterPath(parsed.data.poster_path)) {
    return { status: "error" as const, message: "Format nama fail poster tidak sah." };
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
    if (validatePosterPath(existing.poster_path)) {
      await supabase.storage.from("announcement-posters").remove([existing.poster_path]);
    }
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
    if (validatePosterPath(existing.poster_path)) {
      await supabase.storage.from("announcement-posters").remove([existing.poster_path]);
    }
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
