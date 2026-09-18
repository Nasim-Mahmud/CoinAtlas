import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Coin } from "@/types/coin";
import { coinTitle, formatAccession } from "@/hooks/useCoins";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatCard, ChartTooltip, AXIS_TICK, BRASS, BRONZE, PATINA, LINE, MONO } from "@/components/stats/theme";

export type Period = "all" | "year" | "12mo";

export const PERIODS: { key: Period; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "year", label: "This year" },
  { key: "12mo", label: "Last 12 mo" },
];

/** Acquisition timestamp (acquiredDate, falling back to cataloguing date). */
export function acquiredMs(c: Coin): number {
  if (c.acquiredDate) {
    const t = new Date(c.acquiredDate).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return c.createdAt;
}

export function filterByPeriod(coins: Coin[], period: Period): Coin[] {
  if (period === "all") return coins;
  const now = new Date();
  const cutoff =
    period === "year"
      ? new Date(now.getFullYear(), 0, 1).getTime()
      : now.getTime() - 365 * 24 * 60 * 60 * 1000;
  return coins.filter((c) => acquiredMs(c) >= cutoff);
}

interface YearRow {
  year: string;
  paid: number;
  est: number;
}

/** Spend vs estimated value (stats.md Row 4A), grouped by acquisition year. */
export function SpendValue({ coins, period }: { coins: Coin[]; period: Period }) {
  const scoped = useMemo(() => filterByPeriod(coins, period), [coins, period]);

  const { rows, paid, est } = useMemo(() => {
    const byYear = new Map<number, YearRow>();
    let paid = 0;
    let est = 0;
    for (const c of scoped) {
      if (c.pricePaid == null && c.estimatedValue == null) continue;
      const year = new Date(acquiredMs(c)).getFullYear();
      if (!byYear.has(year)) byYear.set(year, { year: String(year), paid: 0, est: 0 });
      const row = byYear.get(year)!;
      row.paid += c.pricePaid ?? 0;
      row.est += c.estimatedValue ?? 0;
      paid += c.pricePaid ?? 0;
      est += c.estimatedValue ?? 0;
    }
    const rows = [...byYear.values()].sort((a, b) => a.year.localeCompare(b.year));
    return { rows, paid, est };
  }, [scoped]);

  const delta = est - paid;
  const deltaPct = paid > 0 ? Math.round((delta / paid) * 100) : 0;

  return (
    <StatCard overline="ACQUISITIONS" title="Spend vs estimated value">
      {rows.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-serif text-[15.5px] leading-[1.65] text-ink-dim">
            Add prices to your entries to unlock this view.
          </p>
          <Link
            to="/collection"
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-line bg-bg-raised px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
          >
            Open the collection <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 font-mono text-[12px] uppercase tracking-[0.06em] text-ink-dim">
            Total paid <span className="tabular text-ink">{formatMoney(paid)}</span>
            <span className="mx-2 text-bronze">·</span>
            Estimated <span className="tabular text-ink">{formatMoney(est)}</span>
            <span className="mx-2 text-bronze">·</span>
            <span className={cn("tabular", delta >= 0 ? "text-patina" : "text-oxblood")}>
              {delta >= 0 ? "+" : "−"}
              {formatMoney(Math.abs(delta))} ({delta >= 0 ? "+" : ""}
              {deltaPct}%)
            </span>
          </p>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: -8 }} barGap={4}>
                <CartesianGrid vertical={false} stroke={LINE} strokeOpacity={0.5} />
                <XAxis dataKey="year" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: LINE }} />
                <YAxis
                  tick={{ ...AXIS_TICK }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tickFormatter={(v: number) => (v >= 1000 ? `$${Math.round(v / 100) / 10}k` : `$${v}`)}
                />
                <Tooltip
                  cursor={{ fill: "rgba(201,162,75,0.08)" }}
                  content={
                    <ChartTooltip
                      renderEntry={(e) => `${e.name === "paid" ? "Paid" : "Est. value"} ${formatMoney(Number(e.value ?? 0))}`}
                    />
                  }
                />
                <Legend
                  formatter={(v: string) => (
                    <span style={{ fontFamily: MONO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#B3A488" }}>
                      {v === "paid" ? "Paid" : "Est. value"}
                    </span>
                  )}
                />
                <Bar dataKey="paid" name="paid" fill={BRONZE} radius={[3, 3, 0, 0]} />
                <Bar dataKey="est" name="est" fill={BRASS} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </StatCard>
  );
}

/** Recently catalogued (stats.md Row 4B): rail + dots timeline, last 6. */
export function RecentTimeline({ coins }: { coins: Coin[] }) {
  const recent = useMemo(
    () => [...coins].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6),
    [coins],
  );

  return (
    <StatCard
      overline="LEDGER"
      title="Recently catalogued"
      action={
        <Link
          to="/collection?sort=newest"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-brass transition-colors hover:text-brass-bright"
        >
          View all <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      }
    >
      <ol className="relative ml-1.5 space-y-5 border-l border-line pl-5">
        {recent.map((c, i) => {
          const value = c.estimatedValue ?? c.pricePaid;
          return (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="relative"
            >
              <span
                aria-hidden
                className="absolute -left-[26px] top-1.5 size-2.5 rounded-full border-2 border-bg-raised"
                style={{ background: i === 0 ? PATINA : "#4A3C26" }}
              />
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                    {formatDate(c.createdAt)} · {formatAccession(c.accessionNo)}
                  </p>
                  <Link
                    to={`/coin/${c.id}`}
                    className="mt-0.5 block truncate font-serif text-[15px] text-ink transition-colors hover:text-brass"
                  >
                    {coinTitle(c)}
                  </Link>
                </div>
                {value != null && (
                  <span className="tabular shrink-0 font-mono text-[12px] text-ink-dim">{formatMoney(value)}</span>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
        {formatNumber(coins.length)} entries in the ledger
      </p>
    </StatCard>
  );
}
