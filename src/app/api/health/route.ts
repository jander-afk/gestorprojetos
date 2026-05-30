import { NextResponse } from "next/server";

// Healthcheck leve: se o processo Next responde, está saudável.
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
