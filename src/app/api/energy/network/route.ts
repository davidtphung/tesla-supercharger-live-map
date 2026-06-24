import { NextResponse } from "next/server";
import { stationProvider } from "@/lib/providers/composite";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = Math.min(72, Math.max(1, Number(searchParams.get("hours") ?? 24)));

    const { snapshots, current } = await stationProvider.fetchNetworkEnergyTimeline(hours);

    return NextResponse.json({
      scope: "network",
      hours,
      snapshots,
      current,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch network energy",
      },
      { status: 500 }
    );
  }
}