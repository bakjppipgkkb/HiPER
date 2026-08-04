import { createClient } from "@/lib/supabase/server";
import type { DataResult } from "@/lib/data/result";

export type PublicOrganisationItem = {
  id: string;
  fullName: string;
  photoPath: string | null;
  unitNameBm: string | null;
  unitNameEn: string | null;
  positionBm: string;
  positionEn: string;
  level: number;
  displayOrder: number;
};

export async function getPublicOrganisation(): Promise<DataResult<PublicOrganisationItem[]>> {
  const supabase = await createClient();
  if (!supabase) return { status: "unconfigured", data: [] };

  const { data, error } = await supabase
    .from("organisation_assignments")
    .select(`
      id, position_bm, position_en, level, display_order,
      organisation_officers!inner(full_name, photo_path, is_active),
      organisation_units(name_bm, name_en, is_active)
    `)
    .eq("is_active", true)
    .order("level")
    .order("display_order");

  if (error) return { status: "error", data: [], message: error.message };

  const mapped = (data ?? []).flatMap((row) => {
    const officer = Array.isArray(row.organisation_officers)
      ? row.organisation_officers[0]
      : row.organisation_officers;
    const unit = Array.isArray(row.organisation_units)
      ? row.organisation_units[0]
      : row.organisation_units;

    if (!officer?.is_active || (unit && !unit.is_active)) return [];

    return [{
      id: row.id,
      fullName: officer.full_name,
      photoPath: officer.photo_path,
      unitNameBm: unit?.name_bm ?? null,
      unitNameEn: unit?.name_en ?? null,
      positionBm: row.position_bm,
      positionEn: row.position_en,
      level: row.level,
      displayOrder: row.display_order,
    }];
  });

  return { status: "ready", data: mapped };
}
