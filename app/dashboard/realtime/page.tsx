"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type PzemData = {
  power: number;
  energy: number;
  voltage?: number;
  current?: number;
  frequency?: number;
  powerFactor?: number;
};

type DhtData = {
  temp: string;
  hum: string;
};

type AutomationData = {
  terminal1: boolean;
  terminal2: boolean;
};

type LimitData = {
  daily_dynamic: number;
  monthly: number;
};

type ModeData = {
  current: string;
};

type RealtimeResponse = {
  pzem1: PzemData;
  pzem2: PzemData;
  dht: DhtData;
  pir: string;
  status: string;
  warningDaily: string;
  warningMonthlyHit: boolean;
  automation: {
    temp: AutomationData;
  };
  limit: LimitData;
  mode: ModeData;
  usageDaily: number;
  usageMonthly: number;
  connected: boolean;
};

type DailyHistoryEntry = {
  date: string;
  kwh: number;
  rupiah: number;
};

type DailyResponse = {
  history: DailyHistoryEntry[];
  today: {
    today: number;
    todayRupiah: string;
    lastDay: number;
    dayStartEnergy: number;
  };
};

type HourlyHistoryEntry = {
  hour: string;
  kwh: number;
  rupiah: number;
};

type HourlyResponse = {
  history: HourlyHistoryEntry[];
};

type MinuteEntry = {
  minute: string;
  kwh: number;
  rupiah: number;
};

type MinuteResponse = {
  history: MinuteEntry[];
  current: {
    current: number;
    currentRupiah: string;
    lastMinuteKey: string;
    minuteStartEnergy: number;
  };
};

type MonthlyHistoryEntry = {
  date: string;
  kwh: number;
  rupiah: number;
};

type MonthlyResponse = {
  history: MonthlyHistoryEntry[];
  current: {
    total: number;
    totalRupiah: string;
    lastMonth: number;
    monthStartEnergy: number;
  };
};

type PzemDetail = {
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  powerFactor: number;
};

function fmtRp(val: number): string {
  return `Rp ${val.toLocaleString("id-ID")}`;
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const label = data.minute || data.hour || data.date || "";
    return (
      <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-lg space-y-1.5 min-w-[140px]">
        <p className="text-xs font-semibold text-gray-400 border-b border-gray-100 pb-1">{label}</p>
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-500 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> Daya
          </span>
          <span className="font-bold text-blue-600">{data.kwh} kWh</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-500 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Biaya
          </span>
          <span className="font-bold text-green-600">{fmtRp(data.rupiah ?? 0)}</span>
        </div>
      </div>
    );
  }
  return null;
}

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
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1.5 ${color}`}>
        {value}
        {unit && <span className="text-sm font-normal ml-1 text-gray-400">{unit}</span>}
      </p>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  sub,
}: {
  icon: string;
  title: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">
        {icon} {title}
      </p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function SystemStatusCard({
  data,
  mode,
}: {
  data: RealtimeResponse;
  mode: ModeData;
}) {
  const dailyPct =
    data.limit.daily_dynamic > 0
      ? Math.min(100, (data.usageDaily / data.limit.daily_dynamic) * 100)
      : null;
  const monthlyPct =
    data.limit.monthly > 0
      ? Math.min(100, (data.usageMonthly / data.limit.monthly) * 100)
      : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
        Status Sistem
      </p>
      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            data.connected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm text-gray-700">
          {data.connected ? "Online" : "Offline"}
        </span>
      </div>
      <div>
        <p className="text-xs text-gray-400">Mode</p>
        <span
          className={`inline-block mt-1 text-sm font-medium px-2.5 py-0.5 rounded-full ${
            mode.current === "hemat"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {mode.current === "hemat" ? "HEMAT" : "NORMAL"}
        </span>
      </div>
      <div>
        <p className="text-xs text-gray-400">Limit Harian</p>
        {data.limit.daily_dynamic > 0 ? (
          <div className="mt-1">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-gray-900">
                {data.usageDaily.toFixed(2)} / {data.limit.daily_dynamic} kWh
              </span>
              <span className="text-xs text-gray-400">
                {dailyPct}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  dailyPct !== null && dailyPct > 90
                    ? "bg-red-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(100, dailyPct ?? 0)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-1">Belum diset</p>
        )}
      </div>
      <div>
        <p className="text-xs text-gray-400">Limit Bulanan</p>
        {data.limit.monthly > 0 ? (
          <div className="mt-1">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-gray-900">
                {data.usageMonthly.toFixed(1)} / {data.limit.monthly} kWh
              </span>
              <span className="text-xs text-gray-400">
                {monthlyPct}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  monthlyPct !== null && monthlyPct > 90
                    ? "bg-red-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(100, monthlyPct ?? 0)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-1">Belum diset</p>
        )}
      </div>
      {data.warningMonthlyHit ? (
        <div className="bg-red-50 text-red-700 text-sm font-medium px-3 py-2 rounded-lg">
          MONTHLY LIMIT REACHED
        </div>
      ) : data.warningDaily === "WARNING" ? (
        <div className="bg-yellow-50 text-yellow-700 text-sm font-medium px-3 py-2 rounded-lg">
          Daily Limit Warning
        </div>
      ) : (
        <div className="bg-green-50 text-green-700 text-sm font-medium px-3 py-2 rounded-lg">
          Safe
        </div>
      )}
    </div>
  );
}

function EnvCard({ data }: { data: RealtimeResponse }) {
  const pirUpper = String(data.pir || "").toUpperCase();
  const isMotion =
    pirUpper.includes("MOTION DETECTED") ||
    pirUpper === "MOTION" ||
    pirUpper === "DETECTED" ||
    pirUpper === "TRUE" ||
    pirUpper === "1" ||
    (pirUpper.includes("MOTION") && !pirUpper.includes("NO"));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
        Kondisi Lingkungan
      </p>
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-sm">🌡 Temperature</span>
        <span className="font-semibold text-gray-900 text-sm">
          {data.dht.temp}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-sm">💧 Humidity</span>
        <span className="font-semibold text-gray-900 text-sm">
          {data.dht.hum}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-sm">🚶 PIR Motion</span>
        <span
          className={`font-semibold text-sm ${
            isMotion ? "text-yellow-600" : "text-gray-400"
          }`}
        >
          {isMotion ? "Motion Detected" : "No Motion"}
        </span>
      </div>
    </div>
  );
}

function PzemDetailCard({
  label,
  pzem,
}: {
  label: string;
  pzem: PzemDetail;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{label}</h4>
      {[
        { name: "Voltage", value: `${pzem.voltage.toFixed(1)} V`, color: "text-blue-600" },
        { name: "Current", value: `${pzem.current.toFixed(2)} A`, color: "text-cyan-600" },
        { name: "Power", value: `${pzem.power.toFixed(1)} W`, color: "text-blue-500" },
        { name: "Energy", value: `${pzem.energy.toFixed(3)} kWh`, color: "text-green-600" },
        { name: "Frequency", value: `${pzem.frequency.toFixed(1)} Hz`, color: "text-purple-600" },
        { name: "Power Factor", value: pzem.powerFactor.toFixed(2), color: "text-gray-600" },
      ].map((item) => (
        <div key={item.name} className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{item.name}</span>
          <span className={`text-sm font-semibold ${item.color}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function TerminalMonitoringCard({
  data,
}: {
  data: RealtimeResponse;
}) {
  const t1Status = data.automation.temp.terminal1;
  const t2Status = data.automation.temp.terminal2;
  const totalPower = data.pzem1.power + data.pzem2.power;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          🔌 Terminal Monitoring
        </h3>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          LIVE
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Terminal 1 */}
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">
            Terminal 1
          </p>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span
              className={`w-2 h-2 rounded-full ${
                t1Status ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                t1Status ? "text-green-600" : "text-gray-400"
              }`}
            >
              {t1Status ? "ON" : "OFF"}
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {data.pzem1.power.toFixed(0)}
            <span className="text-sm font-normal text-gray-400 ml-1">W</span>
          </p>
        </div>
        {/* Terminal 2 */}
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">
            Terminal 2
          </p>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span
              className={`w-2 h-2 rounded-full ${
                t2Status ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                t2Status ? "text-green-600" : "text-gray-400"
              }`}
            >
              {t2Status ? "ON" : "OFF"}
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {data.pzem2.power.toFixed(0)}
            <span className="text-sm font-normal text-gray-400 ml-1">W</span>
          </p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
          Total Realtime Power
        </span>
        <span className="text-lg font-bold text-gray-900">
          ⚡ {totalPower.toFixed(0)}
          <span className="text-sm font-normal text-gray-400 ml-1">W</span>
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [realtimeData, setRealtimeData] = useState<RealtimeResponse | null>(
    null
  );
  const [dailyData, setDailyData] = useState<DailyResponse | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyResponse | null>(null);
  const [minuteData, setMinuteData] = useState<MinuteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState("00:00:00");
  const [lastUpdate, setLastUpdate] = useState("");
  const [timeRange, setTimeRange] = useState("24");

  const fetchWithTimeout = async (
  url: string,
  timeoutMs = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
};

const fetchRealtime = useCallback(async (): Promise<boolean> => {
    try {
      const rtRes = await fetchWithTimeout("/api/realtime");
      if (!rtRes.ok) return false;
      const json = await rtRes.json();
      setRealtimeData(json);
      setError(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchUsageData = useCallback(async (): Promise<boolean> => {
    try {
      const dailyRes = await fetchWithTimeout("/api/usage/daily");
      const hourlyRes = await fetchWithTimeout("/api/usage/hourly");
      const monthlyRes = await fetchWithTimeout("/api/usage/monthly");
      const minuteRes = await fetchWithTimeout("/api/usage/minute");
      if (dailyRes.ok) setDailyData(await dailyRes.json());
      if (hourlyRes.ok) setHourlyData(await hourlyRes.json());
      if (monthlyRes.ok) setMonthlyData(await monthlyRes.json());
      if (minuteRes.ok) setMinuteData(await minuteRes.json());
      return dailyRes.ok || hourlyRes.ok || monthlyRes.ok || minuteRes.ok;
    } catch {
      return false;
    }
  }, []);

  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchAll() {
      try {
        const [rtOk, usageOk] = await Promise.all([
          fetchRealtime(),
          fetchUsageData(),
        ]);
        if (active) {
          setError(null);
          setDataError(!rtOk && !usageOk);
        }
      } catch {
        if (active) {
          setError("Gagal memuat data");
          setDataError(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchAll();
    const interval = setInterval(() => {
      fetchRealtime();
      fetchUsageData();
    }, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchRealtime, fetchUsageData]);

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
    return () => {
      clockActive = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (realtimeData) {
      const now = new Date();
      const d = now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      setLastUpdate(`${d} ${clock}`);
    }
  }, [clock, realtimeData]);

  const chartData: any[] = useMemo(() => {
    if (timeRange === "menit") {
      if (!minuteData) return [];
      return minuteData.history;
    }
    if (timeRange === "24") {
      if (!hourlyData) return [];
      return hourlyData.history;
    }
    if (timeRange === "bulan") {
      if (!monthlyData) return [];
      return monthlyData.history.slice(-12);
    }
    if (!dailyData) return [];
    return dailyData.history.slice(-30);
  }, [timeRange, minuteData, hourlyData, monthlyData, dailyData]);

  const totalChartKwh = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + (Number(curr.kwh) || 0), 0);
  }, [chartData]);

  const totalChartRupiah = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + (Number(curr.rupiah) || 0), 0);
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!realtimeData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-4">
        <p className="text-lg font-medium">
          {dataError
            ? "Gagal menyambung ke Firebase"
            : "Memuat data..."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-500 hover:underline"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const d = realtimeData;
  const totalPower = d.pzem1.power + d.pzem2.power;
  const totalEnergy = d.pzem1.energy + d.pzem2.energy;

  const pzem1Detail: PzemDetail = {
    voltage: 220,
    current: d.pzem1.power / 220 || 0,
    power: d.pzem1.power,
    energy: d.pzem1.energy,
    frequency: 50,
    powerFactor: 0.95,
  };
  const pzem2Detail: PzemDetail = {
    voltage: 220,
    current: d.pzem2.power / 220 || 0,
    power: d.pzem2.power,
    energy: d.pzem2.energy,
    frequency: 50,
    powerFactor: 0.95,
  };

  const modeLabel = d.mode.current === "hemat" ? "HEMAT" : "NORMAL";

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              ⚡ IoT Power Monitor
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Raspberry Pi 5 • ESP32
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Last Update</span>
          <span className="text-xs font-mono text-gray-500 tabular-nums">
            {lastUpdate}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon="⚡"
          title="Power Now"
          value={`${totalPower.toFixed(0)} W`}
          sub={`${(totalPower / 220).toFixed(2)} A`}
        />
        <SummaryCard
          icon="📅"
          title="Hari Ini"
          value={`${d.usageDaily.toFixed(2)} kWh`}
          sub={fmtRp(dailyData?.today.todayRupiah ? parseInt(dailyData.today.todayRupiah.replace(/[^0-9]/g, "")) : 0)}
        />
        <SummaryCard
          icon="📆"
          title="Bulan Ini"
          value={`${d.usageMonthly.toFixed(1)} kWh`}
          sub={fmtRp(dailyData ? Math.round(d.usageMonthly * 1500) : 0)}
        />
        <SummaryCard
          icon="⚙"
          title="Mode"
          value={modeLabel}
        />
      </div>

      {/* Terminal Monitoring */}
      <TerminalMonitoringCard data={d} />

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">
              Penggunaan Daya & Biaya
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Total: <span className="font-semibold text-blue-600">{totalChartKwh.toFixed(3)} kWh</span> • <span className="font-semibold text-green-600">{fmtRp(totalChartRupiah)}</span>
            </p>
          </div>
          <div className="flex gap-1">
            {["menit", "24", "30", "bulan"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  timeRange === range
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {range === "menit" ? "Menit" : range === "24" ? "Jam" : range === "bulan" ? "Bulan" : "Hari"}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey={timeRange === "menit" ? "minute" : timeRange === "24" ? "hour" : "date"}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="kwh"
                stroke="#2563EB"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorKwh)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Environment + System Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <EnvCard data={d} />
        <SystemStatusCard data={d} mode={d.mode} />
      </div>

      {/* Accordion */}
      <div className="space-y-2">
        <AccordionItem title="Riwayat Per Jam">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs uppercase">
                    Jam
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500 text-xs uppercase">
                    kWh
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500 text-xs uppercase">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {(hourlyData?.history ?? []).map((entry, idx) => (
                  <tr
                    key={entry.hour + idx}
                    className="border-b border-gray-50"
                  >
                    <td className="py-2 px-3 text-gray-700">{entry.hour}</td>
                    <td className="py-2 px-3 text-right font-medium text-gray-900">
                      {entry.kwh}
                    </td>
                    <td className="py-2 px-3 text-right text-green-600">
                      {fmtRp(entry.rupiah)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AccordionItem>

        <AccordionItem title="Riwayat Harian">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs uppercase">
                    Date
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500 text-xs uppercase">
                    kWh
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500 text-xs uppercase">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {(dailyData?.history ?? []).map((entry) => (
                  <tr
                    key={entry.date}
                    className="border-b border-gray-50"
                  >
                    <td className="py-2 px-3 text-gray-700">{entry.date}</td>
                    <td className="py-2 px-3 text-right font-medium text-gray-900">
                      {entry.kwh}
                    </td>
                    <td className="py-2 px-3 text-right text-green-600">
                      {fmtRp(entry.rupiah)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AccordionItem>

        <AccordionItem title="Riwayat Bulanan">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs uppercase">
                    Month
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500 text-xs uppercase">
                    kWh
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500 text-xs uppercase">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {(monthlyData?.history ?? []).map((entry) => (
                  <tr
                    key={entry.date}
                    className="border-b border-gray-50"
                  >
                    <td className="py-2 px-3 text-gray-700">{entry.date}</td>
                    <td className="py-2 px-3 text-right font-medium text-gray-900">
                      {entry.kwh}
                    </td>
                    <td className="py-2 px-3 text-right text-green-600">
                      {fmtRp(entry.rupiah)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AccordionItem>

        <AccordionItem title="Detail Sensor (PZEM)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PzemDetailCard label="PZEM 1" pzem={pzem1Detail} />
            <PzemDetailCard label="PZEM 2" pzem={pzem2Detail} />
          </div>
        </AccordionItem>

        <AccordionItem title="Log Sistem">
          <div className="space-y-0">
            {[
              {
                time: lastUpdate,
                message: "Dashboard updated",
              },
              {
                time: lastUpdate,
                message: `System mode: ${modeLabel}`,
              },
              {
                time: lastUpdate,
                message: `PZEM 1: ${d.pzem1.power.toFixed(1)} W`,
              },
              {
                time: lastUpdate,
                message: `PZEM 2: ${d.pzem2.power.toFixed(1)} W`,
              },
            ].map((log, i) => (
              <div key={i} className="relative pb-4 pl-6 last:pb-0">
                <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500" />
                {i < 3 && (
                  <div className="absolute left-[5px] top-4 w-0.5 h-full bg-gray-200" />
                )}
                <p className="text-xs text-gray-400 font-mono">{log.time}</p>
                <p className="text-sm text-gray-700 mt-0.5">{log.message}</p>
              </div>
            ))}
          </div>
        </AccordionItem>
      </div>
    </div>
  );
}

function AccordionItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="bg-white rounded-2xl border border-gray-100 shadow-sm group">
      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <svg
          className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}