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
import type { MonthlyResponse } from "@/types";

export default function MonthlyPage() {
  const [data, setData] = useState<MonthlyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/usage/monthly");
        if (!res.ok) throw new Error("Gagal mengambil data");
        const json = await res.json();
        setData(json);
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

  const chartData = data.history.slice(-12).map((entry) => ({
    month: entry.date,
    kWh: entry.kwh,
    Rp: entry.rupiah,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Penggunaan Bulanan</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Bulan Ini</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">
            {data.current.total}
            <span className="text-sm font-normal ml-1">kWh</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Biaya</p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {data.current.totalRupiah}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Bulan Lalu</p>
          <p className="text-2xl font-bold mt-1 text-gray-700">
            {data.current.lastMonth}
            <span className="text-sm font-normal ml-1">kWh</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Awal Bulan</p>
          <p className="text-2xl font-bold mt-1 text-gray-700">
            {data.current.monthStartEnergy}
            <span className="text-sm font-normal ml-1">kWh</span>
          </p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Riwayat 12 Bulan Terakhir
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) =>
                    name === "kWh" ? [`${value} kWh`, "Energi"] : [`Rp ${Number(value).toLocaleString()}`, "Biaya"]
                  }
                />
                <Bar dataKey="kWh" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
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
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Bulan</th>
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
