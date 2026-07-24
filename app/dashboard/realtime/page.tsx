"use client";

import { useEffect, useState } from "react";
import type { RealtimeResponse, DailyResponse } from "@/types";

function StatCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string | number;
  unit?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>
        {value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function TerminalBadge({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        on ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${on ? "bg-green-500" : "bg-gray-400"}`}
      />
      {on ? "ON" : "OFF"}
    </span>
  );
}

function WarningBadge({ active, label }: { active: boolean; label: string }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      {label}
    </span>
  );
}

function LimitBar({
  used,
  limit,
  label,
}: {
  used: number;
  limit: number;
  label: string;
}) {
  const remaining = limit > 0 ? Math.max(0, limit - used) : null;
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      {limit > 0 ? (
        <>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-lg font-bold text-gray-900">
              {used.toFixed(2)}
              <span className="text-sm font-normal text-gray-500 ml-1">/ {limit}</span>
            </span>
            <span className="text-sm text-gray-500">
              Sisa: <span className="font-semibold text-green-600">{remaining?.toFixed(2)}</span>
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                pct !== null && pct > 90 ? "bg-red-500" : "bg-blue-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400">Belum diset</p>
      )}
    </div>
  );
}

export default function RealtimePage() {
  const [data, setData] = useState<RealtimeResponse | null>(null);
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const [rtRes, dailyRes] = await Promise.all([
          fetch("/api/realtime"),
          fetch("/api/usage/daily"),
        ]);
        if (!rtRes.ok) throw new Error("Gagal mengambil data");
        const rtJson = await rtRes.json();
        const dailyJson = dailyRes.ok ? await dailyRes.json() : null;
        if (active) {
          setData(rtJson);
          setDaily(dailyJson);
          setError(null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Error");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-blue-500 hover:underline"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (!data) return null;

  const totalPower = data.pzem1.power + data.pzem2.power;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Sensor Realtime</h2>
          <p className="text-sm text-gray-500">Pembaruan otomatis setiap 3 detik</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              data.connected
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                data.connected ? "bg-green-500" : "bg-red-500 animate-pulse"
              }`}
            />
            {data.connected ? "Tersambung" : "Terputus"}
          </span>
          <WarningBadge active={data.warningDaily === "WARNING"} label="Limit Harian" />
          <WarningBadge active={data.warningMonthlyHit} label="Limit Bulanan" />
        </div>
      </div>

      {/* Status & Mode */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                data.status === "NORMAL" ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm font-medium text-gray-700">{data.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Mode:</span>
            <span
              className={`text-sm font-medium px-2 py-0.5 rounded ${
                data.mode.current === "hemat"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {data.mode.current === "hemat" ? "HEMAT" : "NORMAL"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Motion:</span>
            <span
              className={`text-sm font-medium ${
                data.pir === "MOTION" ? "text-yellow-600" : "text-gray-500"
              }`}
            >
              {data.pir}
            </span>
          </div>
        </div>
      </div>

      {/* Sensor Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Daya Total"
          value={totalPower.toFixed(1)}
          unit="W"
          color="text-blue-600"
        />
        <StatCard
          label="PZEM 1"
          value={data.pzem1.power.toFixed(1)}
          unit="W"
          color="text-blue-500"
        />
        <StatCard
          label="PZEM 2"
          value={data.pzem2.power.toFixed(1)}
          unit="W"
          color="text-blue-500"
        />
        <StatCard
          label="Energi Total"
          value={(data.pzem1.energy + data.pzem2.energy).toFixed(2)}
          unit="kWh"
          color="text-green-600"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Suhu" value={data.dht.temp} unit="" color="text-orange-500" />
        <StatCard label="Kelembaban" value={data.dht.hum} unit="" color="text-cyan-500" />
        <StatCard
          label="PIR"
          value={data.pir === "MOTION" ? "Motion" : "No Motion"}
          unit=""
          color={data.pir === "MOTION" ? "text-yellow-600" : "text-gray-400"}
        />
      </div>

      {/* Terminal Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Status Terminal</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Terminal 1</span>
            <TerminalBadge on={data.automation.temp.terminal1} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Terminal 2</span>
            <TerminalBadge on={data.automation.temp.terminal2} />
          </div>
        </div>
      </div>

      {/* Limit */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LimitBar
          used={data.usageDaily}
          limit={data.limit.daily_dynamic}
          label="Limit Hari Ini (kWh)"
        />
        <LimitBar
          used={data.usageMonthly}
          limit={data.limit.monthly}
          label="Limit Bulanan (kWh)"
        />
      </div>

      {/* Riwayat */}
      {daily && daily.history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Log Riwayat Harian</h3>
          </div>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Tanggal</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">kWh</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Rupiah</th>
                </tr>
              </thead>
              <tbody>
                {daily.history.slice().reverse().map((entry) => (
                  <tr key={entry.date} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-gray-700">{entry.date}</td>
                    <td className="px-4 py-2 text-right font-medium">{entry.kwh}</td>
                    <td className="px-4 py-2 text-right text-green-600">
                      Rp {entry.rupiah.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
