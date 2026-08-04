import { NextResponse } from "next/server";
import { hasSupabaseEnvironment } from "@/lib/env";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "hiper-v2",
    databaseConfigured: hasSupabaseEnvironment(),
    timestamp: new Date().toISOString(),
  });
}
