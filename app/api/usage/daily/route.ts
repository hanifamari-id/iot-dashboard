export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { fetchDB } from "@/lib/firebase-rest";
import { parseRiwayatEntry } from "@/lib/parse";

export async function GET() {
  try {
    const [riwayatData, dailyData] = await Promise.all([
      fetchDB<Record<string, string>>("usage/riwayat/daily"),
      fetchDB<Record<string, unknown>>("usage/daily"),
    ]);

    const riwayat = riwayatData || {};
    const daily = dailyData || {};

    const history = Object.entries(riwayat).map(([date, value]) => ({
      date,
      ...parseRiwayatEntry(value),
    }));

    history.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      history,
      today: {
        today: daily.today || 0,
        todayRupiah: daily.today_rupiah || "Rp 0",
        lastDay: daily.lastDay || 0,
        dayStartEnergy: daily.dayStartEnergy || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching daily data:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data harian" },
      { status: 500 }
    );
  }
}
