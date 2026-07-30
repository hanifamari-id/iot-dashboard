import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const DB_PATH = join(process.cwd(), "data", "hourly.json");

interface HourlyDb {
  date: string;
  hours: Record<string, { kwh: number; rupiah: number }>;
}

async function readDb(): Promise<HourlyDb> {
  try {
    const raw = await readFile(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { date: "", hours: {} };
  }
}

async function writeDb(db: HourlyDb): Promise<void> {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

export async function getHourlyData(): Promise<
  { hour: string; kwh: number; rupiah: number }[]
> {
  const db = await readDb();
  const today = new Date().toISOString().slice(0, 10);

  const hours =
    db.date === today ? db.hours : {};

  return Array.from({ length: 24 }, (_, i) => {
    const hour = String(i).padStart(2, "0") + ":00";
    const entry = hours[hour];
    return {
      hour,
      kwh: entry?.kwh ?? 0,
      rupiah: entry?.rupiah ?? 0,
    };
  });
}

export async function appendHourly(
  hour: string,
  kwh: number,
  rupiah: number
): Promise<void> {
  const db = await readDb();
  const today = new Date().toISOString().slice(0, 10);

  if (db.date !== today) {
    db.date = today;
    db.hours = {};
  }

  db.hours[hour] = { kwh, rupiah };
  await writeDb(db);
}
