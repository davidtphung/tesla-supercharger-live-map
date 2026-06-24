import { NextResponse } from "next/server";
import { stationProvider } from "@/lib/providers/composite";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { meta } = await stationProvider.fetchStations();
    const { current, snapshots } = await stationProvider.fetchNetworkEnergyTimeline(24);

    return NextResponse.json({
      scope: "network",
      current,
      snapshots: snapshots.slice(-96),
      fetched_at: meta.fetched_at,
      power_in_kw: current.power_in_kw,
      power_out_kw: current.power_out_kw,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch live energy",
      },
      { status: 500 }
    );
  }
}