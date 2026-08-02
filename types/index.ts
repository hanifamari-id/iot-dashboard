export interface SensorData {
  power: number;
  energy: number;
}

export interface DhtData {
  temp: string;
  hum: string;
}

export interface TerminalState {
  terminal1: boolean;
  terminal2: boolean;
}

export interface Automation {
  temp: TerminalState;
}

export interface Limit {
  daily_dynamic: number;
  monthly: number;
}

export interface Mode {
  current: string;
}

export interface RealtimeResponse {
  pzem1: SensorData;
  pzem2: SensorData;
  dht: DhtData;
  pir: string;
  status: string;
  warningDaily: string;
  warningMonthlyHit: boolean;
  automation: Automation;
  limit: Limit;
  mode: Mode;
  usageDaily: number;
  usageMonthly: number;
  connected: boolean;
}

export interface RiwayatEntry {
  date: string;
  kwh: number;
  rupiah: number;
}

export interface DailyUsage {
  today: number;
  todayRupiah: string;
  lastDay: number;
  dayStartEnergy: number;
}

export interface DailyResponse {
  history: RiwayatEntry[];
  today: DailyUsage;
}

export interface MonthlyUsage {
  total: number;
  totalRupiah: string;
  lastMonth: number;
  monthStartEnergy: number;
}

export interface MonthlyResponse {
  history: RiwayatEntry[];
  current: MonthlyUsage;
}

export interface HourlyEntry {
  hour: string;
  kwh: number;
  rupiah: number;
}

export interface HourlyResponse {
  history: HourlyEntry[];
}

export interface MinuteEntry {
  minute: string;
  kwh: number;
  rupiah: number;
}

export interface MinuteResponse {
  history: MinuteEntry[];
  current: {
    current: number;
    currentRupiah: string;
    lastMinuteKey: string;
    minuteStartEnergy: number;
  };
}

export interface SessionData {
  isLoggedIn: boolean;
}