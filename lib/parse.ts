export function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/[^\d.\-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function parseRiwayatEntry(value: string): {
  kwh: number;
  rupiah: number;
} {
  const kwhMatch = value.match(/kwh:\s*([\d.]+)/);
  const rupiahMatch = value.match(/rupiah:\s*([\d.]+)/);
  return {
    kwh: kwhMatch ? parseFloat(kwhMatch[1]) : 0,
    rupiah: rupiahMatch ? parseFloat(rupiahMatch[1]) : 0,
  };
}