import { NextResponse } from "next/server";
import { stationProvider } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "1";

  try {
    const payload = await stationProvider.fetchStations({ force });
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch stations",
      },
      { status: 500 }
    );
  }
}