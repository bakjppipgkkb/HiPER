import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");

  const safeNext =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/studio";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    ?.trim()
    .replace(/\/+$/, "");

  if (!siteUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SITE_URL is not configured" },
      { status: 500 },
    );
  }

  let siteOrigin: URL;

  try {
    siteOrigin = new URL(siteUrl);
  } catch {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SITE_URL is invalid" },
      { status: 500 },
    );
  }

  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.redirect(
      new URL("/studio/login?error=unconfigured", siteOrigin),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/studio/login?error=missing_code", siteOrigin),
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth code exchange failed:", error.message);

    return NextResponse.redirect(
      new URL("/studio/login?error=oauth_callback", siteOrigin),
    );
  }

  return NextResponse.redirect(new URL(safeNext, siteOrigin));
}
