import { z } from "zod";

export const organisationAssignmentSchema = z.object({
  officer_id: z.uuid(),
  unit_id: z.uuid().nullable(),
  position_bm: z.string().trim().min(1).max(160),
  position_en: z.string().trim().min(1).max(160),
  level: z.number().int().min(0).max(20),
  display_order: z.number().int().min(0),
  is_active: z.boolean(),
});

export const organisationPayloadSchema = z.object({
  assignments: z.array(organisationAssignmentSchema).min(1, {
    message: "Sekurang-kurangnya satu item organisasi diperlukan.",
  }),
});
