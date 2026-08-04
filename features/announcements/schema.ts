import { z } from "zod";

export const announcementSchema = z.object({
  title_bm: z.string().trim().min(1).max(180),
  title_en: z.string().trim().min(1).max(180),
  body_bm: z.string().trim().min(1).max(10_000),
  body_en: z.string().trim().min(1).max(10_000),
  category: z.string().trim().min(1).max(80),
  poster_path: z.string().trim().min(1).nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  published_at: z.iso.datetime().nullable(),
});
