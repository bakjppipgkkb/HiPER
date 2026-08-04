import { z } from "zod";

export const siteSettingsSchema = z.object({
  official_email: z.email().nullable(),
  address_lines: z.array(z.string().trim().max(200)).max(10),
  donation_bank_name: z.string().trim().max(200).nullable(),
  donation_account_name: z.string().trim().max(200).nullable(),
  donation_account_number: z.string().trim().max(80).nullable(),
});
