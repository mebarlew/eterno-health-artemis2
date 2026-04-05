import { NextResponse } from "next/server";
import { fetchMissionData } from "@/lib/horizons";

export async function GET() {
  try {
    const data = await fetchMissionData();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=60" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
