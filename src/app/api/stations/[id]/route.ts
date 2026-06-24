import { NextResponse } from "next/server";
import { stationProvider } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const station = await stationProvider.fetchStation(id);
    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }
    return NextResponse.json(station);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch station",
      },
      { status: 500 }
    );
  }
}