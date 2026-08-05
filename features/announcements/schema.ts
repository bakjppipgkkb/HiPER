import { z } from "zod";

export const announcementSchema = z.object({
  title_bm: z.string().trim().min(1).max(180),
  title_en: z.string().trim().min(1).max(180),
  body_bm: z.string().trim().min(1).max(10_000),
  body_en: z.string().trim().min(1).max(10_000),
  category: z.string().trim().min(1).max(80),
  poster_path: z.string().trim().min(1).nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  published_at: z.string().nullable(),
});

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
