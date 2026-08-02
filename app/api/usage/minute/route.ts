import { NextResponse } from "next/server";
import { fetchDB } from "@/lib/firebase-rest";
import { parseRiwayatEntry } from "@/lib/parse";

export async function GET() {
  try {
    const [riwayatData, minutelyData] = await Promise.all([
      fetchDB<Record<string, string>>("usage/riwayat/minutely"),
      fetchDB<Record<string, unknown>>("usage/minutely"),
    ]);

    const riwayat = riwayatData || {};
    const minutely = minutelyData || {};

    const history = Object.entries(riwayat)
      .map(([key, value]) => {
        const time = key.replace(/^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})$/, "$2:$3");
        return {
          minute: time,
          ...parseRiwayatEntry(value),
        };
      })
      .sort((a, b) => a.minute.localeCompare(b.minute));

    const last60 = history.slice(-60);

    return NextResponse.json({
      history: last60,
      current: {
        current: minutely.current || 0,
        currentRupiah: minutely.current_rupiah || "Rp 0",
        lastMinuteKey: minutely.lastMinuteKey || "",
        minuteStartEnergy: minutely.minuteStartEnergy || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching minute data:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data permenit" },
      { status: 500 }
    );
  }
}