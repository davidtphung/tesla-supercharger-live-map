import { NextResponse } from "next/server";
import { stationProvider } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await stationProvider.fetchStations({ force: true });
    return NextResponse.json({
      ok: true,
      refreshed_at: payload.meta.fetched_at,
      count: payload.meta.record_count,
      source: payload.meta.source,
      confidence: payload.meta.confidence,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Refresh failed",
      },
      { status: 500 }
    );
  }
}