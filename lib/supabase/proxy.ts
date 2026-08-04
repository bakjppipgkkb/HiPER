import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnvironment, hasSupabaseEnvironment } from "@/lib/env";
import type { Database } from "@/lib/types/database";

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnvironment()) return NextResponse.next({ request });

  const { url, publishableKey } = getSupabaseEnvironment();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}
