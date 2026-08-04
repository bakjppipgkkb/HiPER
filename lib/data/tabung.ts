import { createClient } from "@/lib/supabase/server";
import type { DataResult } from "@/lib/data/result";
import type { Database } from "@/lib/types/database";

type TabungRecord = Database["public"]["Tables"]["tabung_records"]["Row"];

export async function getPublicTabungRecords(): Promise<DataResult<TabungRecord[]>> {
  const supabase = await createClient();
  if (!supabase) return { status: "unconfigured", data: [] };

  const { data, error } = await supabase
    .from("tabung_records")
    .select("*")
    .eq("public_visible", true)
    .order("occurred_on", { ascending: false });

  if (error) return { status: "error", data: [], message: error.message };
  return { status: "ready", data: data ?? [] };
}
