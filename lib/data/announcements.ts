import { createClient } from "@/lib/supabase/server";
import type { DataResult } from "@/lib/data/result";
import type { Database } from "@/lib/types/database";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

export async function getPublishedAnnouncements(): Promise<DataResult<Announcement[]>> {
  const supabase = await createClient();
  if (!supabase) return { status: "unconfigured", data: [] };

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false });

  if (error) {
    return { status: "error", data: [], message: error.message };
  }

  return { status: "ready", data: data ?? [] };
}

export function announcementPosterUrl(posterPath: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!posterPath || !base) return null;
  return `${base}/storage/v1/object/public/announcement-posters/${posterPath}`;
}
