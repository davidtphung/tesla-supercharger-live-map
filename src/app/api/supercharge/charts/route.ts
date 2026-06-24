import { NextResponse } from "next/server";
import { fetchSuperchargeCharts } from "@/lib/providers/adapters/supercharge-charts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "1";
    const data = await fetchSuperchargeCharts(force);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch supercharge charts",
      },
      { status: 500 }
    );
  }
}