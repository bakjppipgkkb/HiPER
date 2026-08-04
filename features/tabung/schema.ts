import { z } from "zod";

export const tabungRecordSchema = z.object({
  type: z.enum(["COLLECTION", "DISTRIBUTION"]),
  amount_sen: z.number().int().positive().max(100_000_000),
  description_bm: z.string().trim().min(1).max(500),
  description_en: z.string().trim().min(1).max(500),
  recipient: z.string().trim().max(200).nullable(),
  occurred_on: z.iso.date(),
  public_visible: z.boolean(),
});

export const publicDonationSchema = z.object({
  amount_sen: z.number().int().positive().max(1_000_000),
});
