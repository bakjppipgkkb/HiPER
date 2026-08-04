import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnvironment, hasSupabaseEnvironment } from "@/lib/env";
import type { Database } from "@/lib/types/database";

export async function createClient() {
  if (!hasSupabaseEnvironment()) return null;

  const { url, publishableKey } = getSupabaseEnvironment();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot always write cookies. The root proxy refreshes them.
        }
      },
    },
  });
}
