"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailyResponse, HourlyResponse } from "@/types";

export default function DailyPage() {
  const [data, setData] = useState<DailyResponse | null>(null);
  const [hourly, setHourly] = useState<HourlyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState("00:00:00");

  useEffect(() => {
    let clockActive = true;
    function updateClock() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      if (clockActive) setClock(`${h}:${m}:${s}`);
    }
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => { clockActive = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dailyRes, hourlyRes] = await Promise.all([
          fetch("/api/usage/daily"),
          fetch("/api/usage/hourly"),
        ]);
        if (!dailyRes.ok) throw new Error("Gagal mengambil data");
        const dailyJson = await dailyRes.json();
        const hourlyJson = hourlyRes.ok ? await hourlyRes.json() : null;
        setData(dailyJson);
        setHourly(hourlyJson);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
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

  const chartData = data.history.slice(-14).map((entry) => ({
    date: entry.date.slice(5),
    kWh: entry.kwh,
    Rp: entry.rupiah,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Penggunaan Harian</h2>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 tabular-nums">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {clock}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Hari Ini</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">
            {data.today.today}
            <span className="text-sm font-normal ml-1">kWh</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Biaya</p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {data.today.todayRupiah}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Kemarin</p>
          <p className="text-2xl font-bold mt-1 text-gray-700">
            {data.today.lastDay}
            <span className="text-sm font-normal ml-1">kWh</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Awal Hari</p>
          <p className="text-2xl font-bold mt-1 text-gray-700">
            {data.today.dayStartEnergy}
            <span className="text-sm font-normal ml-1">kWh</span>
          </p>
        </div>
      </div>

      {hourly && hourly.history.length > 0 && (
        <>
          <h3 className="text-base font-semibold text-gray-900">Log Perjam</h3>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              Pemakaian Perjam Hari Ini
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourly.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name) =>
                      name === "kWh" ? [`${value} kWh`, "Energi"] : [`Rp ${Number(value).toLocaleString()}`, "Biaya"]
                    }
                  />
                  <Bar dataKey="kWh" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700">Tabel Perjam</h4>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Jam</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-600">kWh</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-600">Rupiah</th>
                  </tr>
                </thead>
                <tbody>
                  {hourly.history.slice().reverse().map((entry) => (
                    <tr key={entry.hour} className="border-t border-gray-100">
                      <td className="px-4 py-2 text-gray-700">{entry.hour}</td>
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
        </>
      )}

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Riwayat 14 Hari Terakhir
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) =>
                    name === "kWh" ? [`${value} kWh`, "Energi"] : [`Rp ${Number(value).toLocaleString()}`, "Biaya"]
                  }
                />
                <Bar dataKey="kWh" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data.history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Tabel Riwayat</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Tanggal</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">kWh</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Rupiah</th>
                </tr>
              </thead>
              <tbody>
                {data.history.slice().reverse().map((entry) => (
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
