import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/") ? requestedNext : "/studio";
  const supabase = await createClient();

  if (!supabase) return NextResponse.redirect(new URL("/studio/login?error=unconfigured", url.origin));
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

if (!siteUrl) {
  throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
}

const safeNext =
  next.startsWith("/") && !next.startsWith("//") ? next : "/studio";

return NextResponse.redirect(new URL(safeNext, `${siteUrl}/`));
}
