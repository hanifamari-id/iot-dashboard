export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { fetchDB, isConnected } from "@/lib/firebase-rest";
import { parseNumber } from "@/lib/parse";

export async function GET() {
  try {
    const [
      sensor,
      statusSystem,
      warningDaily,
      warningMonthlyHit,
      automation,
      limit,
      mode,
      state,
      usageDaily,
      usageMonthly,
    ] = await Promise.all([
      fetchDB("sensor"),
      fetchDB("status/system"),
      fetchDB("warning/daily"),
      fetchDB("warning/monthly_hit"),
      fetchDB("automation"),
      fetchDB("limit"),
      fetchDB("mode"),
      fetchDB("state"),
      fetchDB("usage/daily"),
      fetchDB("usage/monthly"),
    ]);

    if (!sensor) {
      return NextResponse.json(
        { error: "Data sensor tidak tersedia" },
        { status: 404 }
      );
    }

    const s = sensor as Record<string, unknown>;
    const pzem1 = (s.pzem1 || {}) as Record<string, unknown>;
    const pzem2 = (s.pzem2 || {}) as Record<string, unknown>;
    const dht = (s.dht || {}) as Record<string, unknown>;
    const pir = (s.pir as string) || "NO MOTION";

    const auto = (automation || {}) as Record<string, unknown>;
    const lim = (limit || {}) as Record<string, unknown>;
    const mod = (mode || {}) as Record<string, unknown>;
    const st = (state || {}) as Record<string, unknown>;
    const uDaily = (usageDaily || {}) as Record<string, unknown>;
    const uMonthly = (usageMonthly || {}) as Record<string, unknown>;
    const currentMode = (mod.current as string) || "normal";
    const modeState = ((st[currentMode] || {}) as Record<string, unknown>);

    return NextResponse.json({
      pzem1: {
        power: parseNumber(pzem2.power),
        energy: parseNumber(pzem2.energy),
      },
      pzem2: {
        power: parseNumber(pzem1.power),
        energy: parseNumber(pzem1.energy),
      },
      dht: {
        temp: (dht.temp as string) || "-",
        hum: (dht.hum as string) || "-",
      },
      pir,
      status: (statusSystem as string) || "NORMAL",
      warningDaily: (warningDaily as string) || "NORMAL",
      warningMonthlyHit: warningMonthlyHit === true,
      automation: {
        temp: {
          terminal1: modeState.terminal1 !== true,
          terminal2: modeState.terminal2 !== true,
        },
      },
      limit: {
        daily_dynamic: parseNumber(lim.daily_dynamic),
        monthly: parseNumber(lim.monthly),
      },
      mode: {
        current: (mod.current as string) || "normal",
      },
      usageDaily: parseNumber(uDaily.today),
      usageMonthly: parseNumber(uMonthly.total),
      connected: isConnected(),
    });
  } catch (error) {
    console.error("Error fetching realtime data:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data sensor" },
      { status: 500 }
    );
  }
}
