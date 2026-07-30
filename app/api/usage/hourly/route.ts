import { NextResponse } from "next/server";
import { getHourlyData, appendHourly } from "@/lib/hourly-db";

export async function GET() {
  try {
    const history = await getHourlyData();
    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching hourly data:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data perjam" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hour, kwh, rupiah } = body;

    if (typeof hour !== "string" || typeof kwh !== "number" || typeof rupiah !== "number") {
      return NextResponse.json(
        { error: "Format data tidak valid" },
        { status: 400 }
      );
    }

    await appendHourly(hour, kwh, rupiah);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving hourly data:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data perjam" },
      { status: 500 }
    );
  }
}
