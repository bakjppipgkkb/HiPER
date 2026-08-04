"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnvironment } from "@/lib/env";
import type { Database } from "@/lib/types/database";

export function createClient() {
  const { url, publishableKey } = getSupabaseEnvironment();
  return createBrowserClient<Database>(url, publishableKey);
}
