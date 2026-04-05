import { NextResponse } from "next/server";
import { fetchMissionData } from "@/lib/horizons";

export async function GET() {
  try {
    const data = await fetchMissionData();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=60" },
    });
  } catch (error) {
    // Log real error server-side, return generic message to client
    console.error("[/api/position]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to fetch mission data" }, { status: 502 });
  }
}
