const pad = (n: number) => String(n).padStart(2, "0");

/** Local-calendar date key, e.g. "2026-10-06". */
export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(k: string): Date {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(k: string, n: number): string {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

/** Whole calendar days from a to b (DST-safe). */
export function diffDays(a: string, b: string): number {
  const A = parseKey(a);
  const B = parseKey(b);
  return Math.round((Date.UTC(B.getFullYear(), B.getMonth(), B.getDate()) - Date.UTC(A.getFullYear(), A.getMonth(), A.getDate())) / 86400000);
}

/** 1-based program day for `today`. <1 means not started, >60 means finished. */
export function programDay(start: string, today: string): number {
  return diffDays(start, today) + 1;
}

export function fmtDate(k: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  return parseKey(k).toLocaleDateString(undefined, opts);
}

export function hhmmToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToHHMM(m: number): string {
  return `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
}

export function fmtTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${pad(m)} ${ap}`;
}
