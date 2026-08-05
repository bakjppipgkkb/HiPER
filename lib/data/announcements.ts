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

export async function getAllAnnouncements(): Promise<DataResult<Announcement[]>> {
  const supabase = await createClient();
  if (!supabase) return { status: "unconfigured", data: [] };

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { status: "error", data: [], message: error.message };
  }

  return { status: "ready", data: data ?? [] };
}

export { announcementPosterUrl } from "./announcements-client";
