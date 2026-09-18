import { formatDistanceToNow } from "date-fns";

/**
 * Formatting helpers — Intl-based, tabular-friendly (design.md §3 data role).
 */

const numberFmt = new Intl.NumberFormat("en-US");

/** 1,234,567 */
export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

/** "$1,240" (no decimals for whole amounts, 2 decimals otherwise). */
export function formatMoney(n: number, currency: string = "USD"): string {
  const hasCents = Math.abs(n % 1) > 0.004;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(n);
}

/** ISO date ("2021-03-02") or epoch ms → "2 Mar 2021". */
export function formatDate(iso: string | number | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** epoch ms → "3 days ago" (date-fns). */
export function formatRelativeDate(ts: number): string {
  return formatDistanceToNow(new Date(ts), { addSuffix: true });
}

/** 8.5 → "8.5 g" */
export function formatWeight(g?: number): string {
  if (g == null) return "—";
  return `${trimNum(g)} g`;
}

/** 25.75 → "25.75 mm" */
export function formatDiameter(mm?: number): string {
  if (mm == null) return "—";
  return `${trimNum(mm)} mm`;
}

/** 2.2 → "2.2 mm" */
export function formatThickness(mm?: number): string {
  if (mm == null) return "—";
  return `${trimNum(mm)} mm`;
}

/** 128 → "128 entries" / "1 entry" */
export function pluralize(n: number, singular: string, plural?: string): string {
  return `${formatNumber(n)} ${n === 1 ? singular : (plural ?? `${singular}s`)}`;
}

function trimNum(n: number): string {
  return String(Math.round(n * 100) / 100);
}
