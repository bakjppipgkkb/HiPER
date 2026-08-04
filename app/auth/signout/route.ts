import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");

  if (!siteUrl) {
    return NextResponse.json(
      {
        error: "NEXT_PUBLIC_SITE_URL belum ditetapkan dalam .env.local",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.redirect(new URL("/studio/login", siteUrl));
}
