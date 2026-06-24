import { NextResponse } from "next/server";
import { stationProvider } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const hours = Number(searchParams.get("hours") ?? "24");

  try {
    const snapshots = await stationProvider.fetchTimeline(id, hours);
    return NextResponse.json({ station_id: id, snapshots });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch timeline",
      },
      { status: 500 }
    );
  }
}