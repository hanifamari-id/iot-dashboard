import { NextResponse } from "next/server";
import { fetchDB } from "@/lib/firebase-rest";
import { parseRiwayatEntry } from "@/lib/parse";

export async function GET() {
  try {
    const [riwayatData, hourlyData] = await Promise.all([
      fetchDB<Record<string, string>>("usage/riwayat/hourly"),
      fetchDB<Record<string, unknown>>("usage/hourly"),
    ]);

    const riwayat = riwayatData || {};
    const hourly = hourlyData || {};

    const history = Object.entries(riwayat)
      .map(([key, value]) => {
        const time = key.replace(/^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})$/, "$2:$3");
        return {
          rawKey: key,
          hour: time,
          ...parseRiwayatEntry(value),
        };
      })
      .sort((a, b) => a.rawKey.localeCompare(b.rawKey));

    const last24 = history.slice(-24);

    return NextResponse.json({
      history: last24,
      current: {
        current: hourly.current || 0,
        currentRupiah: hourly.current_rupiah || "Rp 0",
        lastHourKey: hourly.lastHourKey || "",
        hourStartEnergy: hourly.hourStartEnergy || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching hourly data:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data perjam" },
      { status: 500 }
    );
  }
}

