import { NextResponse } from "next/server";
import { stationProvider } from "@/lib/providers/composite";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const hours = Math.min(72, Math.max(1, Number(searchParams.get("hours") ?? 24)));

  try {
    const { snapshots, current } = await stationProvider.fetchStationEnergyTimeline(id, hours);
    return NextResponse.json({ station_id: id, hours, snapshots, current });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch station energy",
      },
      { status: 500 }
    );
  }
}