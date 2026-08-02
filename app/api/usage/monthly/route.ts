export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { fetchDB } from "@/lib/firebase-rest";
import { parseRiwayatEntry } from "@/lib/parse";

export async function GET() {
  try {
    const [riwayatData, monthlyData] = await Promise.all([
      fetchDB<Record<string, string>>("usage/riwayat/monthly"),
      fetchDB<Record<string, unknown>>("usage/monthly"),
    ]);

    const riwayat = riwayatData || {};
    const monthly = monthlyData || {};

    const history = Object.entries(riwayat).map(([month, value]) => ({
      date: month,
      ...parseRiwayatEntry(value),
    }));

    history.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      history,
      current: {
        total: monthly.total || 0,
        totalRupiah: monthly.total_rupiah || "Rp 0",
        lastMonth: monthly.lastMonth || 0,
        monthStartEnergy: monthly.monthStartEnergy || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching monthly data:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data bulanan" },
      { status: 500 }
    );
  }
}
