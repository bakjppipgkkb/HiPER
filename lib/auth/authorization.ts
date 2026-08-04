import { createClient } from "@/lib/supabase/server";

export type AdminState =
  | { status: "unconfigured" }
  | { status: "anonymous" }
  | { status: "forbidden"; email: string | null }
  | { status: "authorized"; userId: string; email: string | null };

export async function getAdminState(): Promise<AdminState> {
  const supabase = await createClient();
  if (!supabase) return { status: "unconfigured" };

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return { status: "anonymous" };

  const email =
    typeof claimsData.claims.email === "string" ? claimsData.claims.email : null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile || profile.role !== "ADMIN" || !profile.is_active) {
    return { status: "forbidden", email };
  }

  return { status: "authorized", userId, email };
}
