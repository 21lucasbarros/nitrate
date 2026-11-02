const relativeFormatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
];

/** "há 2 dias", "ontem", "agora" */
export function timeAgo(iso: string): string {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return relativeFormatter.format(Math.round(seconds / size), unit);
    }
  }
  return "agora";
}

/** "outubro de 2026" */
export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/** "31 out. 2026" a partir de "2026-10-31" (sem converter fuso, é só uma data) */
export function shortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** data local de hoje no formato yyyy-mm-dd */
export function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "2026-10" -> "outubro de 2026" */
export function monthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/** "2026-10" -> "2026-09" (delta -1) ou "2026-11" (delta +1) */
export function shiftMonth(yearMonth: string, delta: number): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** mês atual no formato "2026-11" */
export function currentMonth(): string {
  return todayIso().slice(0, 7);
}
