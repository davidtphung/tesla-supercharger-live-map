import { NextResponse } from "next/server";
import { stationProvider } from "@/lib/providers/composite";
import { buildNetworkEnergyTimeline } from "@/lib/scoring/energy-flow";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = Math.min(72, Math.max(1, Number(searchParams.get("hours") ?? 24)));

    const { stations } = await stationProvider.fetchStations();
    const snapshots = buildNetworkEnergyTimeline(stations, hours);

    return NextResponse.json({
      scope: "network",
      hours,
      snapshots,
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