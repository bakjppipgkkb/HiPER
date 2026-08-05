"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/lib/supabase/server";
import { getAdminState } from "@/lib/auth/authorization";

export type ValidationError = {
  title_bm?: string;
  title_en?: string;
  body_bm?: string;
  body_en?: string;
  category?: string;
  status?: string;
  poster_path?: string;
};

// Server-side validation helper
export async function validateAnnouncementFields(input: any) {
  const errors: ValidationError = {};

  const title_bm = typeof input.title_bm === "string" ? input.title_bm.trim() : "";
  const title_en = typeof input.title_en === "string" ? input.title_en.trim() : "";
  const body_bm = typeof input.body_bm === "string" ? input.body_bm.trim() : "";
  const body_en = typeof input.body_en === "string" ? input.body_en.trim() : "";
  const category = typeof input.category === "string" ? input.category.trim() : "";
  const status = input.status;

  if (!title_bm) errors.title_bm = "Tajuk (BM) wajib diisi.";
  else if (title_bm.length > 180) errors.title_bm = "Tajuk (BM) tidak boleh melebihi 180 aksara.";

  if (!title_en) errors.title_en = "Tajuk (EN) wajib diisi.";
  else if (title_en.length > 180) errors.title_en = "Tajuk (EN) tidak boleh melebihi 180 aksara.";

  if (!body_bm) errors.body_bm = "Kandungan (BM) wajib diisi.";
  else if (body_bm.length > 10000) errors.body_bm = "Kandungan (BM) tidak boleh melebihi 10,000 aksara.";

  if (!body_en) errors.body_en = "Kandungan (EN) wajib diisi.";
  else if (body_en.length > 10000) errors.body_en = "Kandungan (EN) tidak boleh melebihi 10,000 aksara.";

  if (!category) errors.category = "Kategori wajib diisi.";
  else if (category.length > 80) errors.category = "Kategori tidak boleh melebihi 80 aksara.";

  if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
    errors.status = "Status tidak sah.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      title_bm,
      title_en,
      body_bm,
      body_en,
      category,
      status,
    },
  };
}

// Server-side file validation helper
export async function validatePosterFile(file: File) {
  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, error: "Fail melebihi had saiz 10 MB." };
  }

  const allowedExtensions = ["png", "jpg", "jpeg"];
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !allowedExtensions.includes(ext)) {
    return { isValid: false, error: "Format fail tidak disokong. Hanya PNG, JPG dan JPEG dibenarkan." };
  }

  const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];
  if (!allowedMimeTypes.includes(file.type)) {
    return { isValid: false, error: "Jenis fail tidak sah. Sila pilih fail gambar PNG, JPG atau JPEG." };
  }

  return { isValid: true, ext };
}

export async function createAnnouncement(prevState: any, formData: FormData) {
  const admin = await getAdminState();
  if (admin.status !== "authorized") {
    return { success: false, error: "Akses dinafikan. Hanya pentadbir (ADMIN) dibenarkan." };
  }

  const payload = {
    title_bm: formData.get("title_bm"),
    title_en: formData.get("title_en"),
    body_bm: formData.get("body_bm"),
    body_en: formData.get("body_en"),
    category: formData.get("category"),
    status: formData.get("status"),
  };

  const validation = await validateAnnouncementFields(payload);
  if (!validation.isValid) {
    return { success: false, validationErrors: validation.errors };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Ralat sambungan pangkalan data." };
  }

  let finalPosterPath: string | null = null;
  const posterFile = formData.get("poster_file") as File | null;

  if (posterFile && posterFile.size > 0) {
    const fileVal = await validatePosterFile(posterFile);
    if (!fileVal.isValid) {
      return { success: false, error: fileVal.error };
    }

    const safeUniqueName = `${crypto.randomUUID()}.${fileVal.ext}`;
    const { error: uploadError } = await supabase.storage
      .from("announcement-posters")
      .upload(safeUniqueName, posterFile, {
        contentType: posterFile.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: `Gagal memuat naik gambar poster: ${uploadError.message}` };
    }

    finalPosterPath = safeUniqueName;
  }

  const published_at = validation.data.status === "PUBLISHED" ? new Date().toISOString() : null;

  const insertData = {
    ...validation.data,
    poster_path: finalPosterPath,
    published_at,
    created_by: admin.userId,
  };

  const { data: newAnnouncement, error } = await supabase
    .from("announcements")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    // Cleanup storage if database insert fails
    if (finalPosterPath) {
      await supabase.storage.from("announcement-posters").remove([finalPosterPath]);
    }
    return { success: false, error: error.message };
  }

  // Audit Log
  await (supabase as any).from("audit_log").insert({
    actor_id: admin.userId,
    action: "CREATE_ANNOUNCEMENT",
    entity_type: "announcements",
    entity_id: newAnnouncement.id,
    before_data: null,
    after_data: JSON.parse(JSON.stringify(newAnnouncement)),
  });

  return { success: true, data: newAnnouncement };
}

export async function updateAnnouncement(id: string, prevState: any, formData: FormData) {
  const admin = await getAdminState();
  if (admin.status !== "authorized") {
    return { success: false, error: "Akses dinafikan. Hanya pentadbir (ADMIN) dibenarkan." };
  }

  const payload = {
    title_bm: formData.get("title_bm"),
    title_en: formData.get("title_en"),
    body_bm: formData.get("body_bm"),
    body_en: formData.get("body_en"),
    category: formData.get("category"),
    status: formData.get("status"),
  };

  const validation = await validateAnnouncementFields(payload);
  if (!validation.isValid) {
    return { success: false, validationErrors: validation.errors };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Ralat sambungan pangkalan data." };
  }

  // Fetch current version
  const { data: existingAnnouncement, error: fetchError } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existingAnnouncement) {
    return { success: false, error: "Pengumuman tidak ditemui." };
  }

  let finalPosterPath = existingAnnouncement.poster_path;
  const posterFile = formData.get("poster_file") as File | null;
  const isPosterRemoved = formData.get("poster_removed") === "true";

  if (isPosterRemoved) {
    finalPosterPath = null;
  }

  if (posterFile && posterFile.size > 0) {
    const fileVal = await validatePosterFile(posterFile);
    if (!fileVal.isValid) {
      return { success: false, error: fileVal.error };
    }

    const safeUniqueName = `${crypto.randomUUID()}.${fileVal.ext}`;
    const { error: uploadError } = await supabase.storage
      .from("announcement-posters")
      .upload(safeUniqueName, posterFile, {
        contentType: posterFile.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: `Gagal memuat naik gambar poster baru: ${uploadError.message}` };
    }

    finalPosterPath = safeUniqueName;
  }

  // Handle published_at logic safely
  let published_at = existingAnnouncement.published_at;
  if (validation.data.status === "PUBLISHED") {
    if (!published_at) {
      published_at = new Date().toISOString();
    }
  } else {
    published_at = null;
  }

  const updateData = {
    ...validation.data,
    poster_path: finalPosterPath,
    published_at,
  };

  const { data: updatedAnnouncement, error: updateError } = await supabase
    .from("announcements")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    // Cleanup newly uploaded file if DB update fails
    if (finalPosterPath && finalPosterPath !== existingAnnouncement.poster_path) {
      await supabase.storage.from("announcement-posters").remove([finalPosterPath]);
    }
    return { success: false, error: updateError.message };
  }

  // Clean up old poster if replaced or removed
  const oldPoster = existingAnnouncement.poster_path;
  if (oldPoster && oldPoster !== finalPosterPath) {
    await supabase.storage.from("announcement-posters").remove([oldPoster]);
  }

  // Audit Log
  await (supabase as any).from("audit_log").insert({
    actor_id: admin.userId,
    action: "UPDATE_ANNOUNCEMENT",
    entity_type: "announcements",
    entity_id: id,
    before_data: JSON.parse(JSON.stringify(existingAnnouncement)),
    after_data: JSON.parse(JSON.stringify(updatedAnnouncement)),
  });

  return { success: true, data: updatedAnnouncement };
}

export async function deleteAnnouncement(id: string) {
  const admin = await getAdminState();
  if (admin.status !== "authorized") {
    return { success: false, error: "Akses dinafikan. Hanya pentadbir (ADMIN) dibenarkan." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Ralat sambungan pangkalan data." };
  }

  // Fetch current version for audit log and storage cleanup
  const { data: existingAnnouncement, error: fetchError } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existingAnnouncement) {
    return { success: false, error: "Pengumuman tidak ditemui." };
  }

  const { error: deleteError } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  // Clean up poster file from storage
  const oldPoster = existingAnnouncement.poster_path;
  if (oldPoster) {
    await supabase.storage.from("announcement-posters").remove([oldPoster]);
  }

  // Audit Log
  await (supabase as any).from("audit_log").insert({
    actor_id: admin.userId,
    action: "DELETE_ANNOUNCEMENT",
    entity_type: "announcements",
    entity_id: id,
    before_data: JSON.parse(JSON.stringify(existingAnnouncement)),
    after_data: null,
  });

  return { success: true };
}
