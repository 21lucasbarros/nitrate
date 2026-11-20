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

/**
 * Versão curta para legendas estreitas: "agora", "15 min", "2 h", "ontem", "9 d", "3 meses", "1 ano".
 * Nunca vira data por extenso: "11 de nov." cortava o nome ao lado.
 */
export function shortAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 2) return "ontem";
  if (days < 30) return `${days} d`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "1 mês" : `${months} meses`;
  const years = Math.floor(days / 365);
  return years === 1 ? "1 ano" : `${years} anos`;
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

const SHORT_MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "1 nov" no ano atual, "1 nov 2024" nos outros: cabe numa linha por cima do pôster */
export function compactDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${SHORT_MONTHS[month - 1]}${year !== new Date().getFullYear() ? ` ${year}` : ""}`;
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
