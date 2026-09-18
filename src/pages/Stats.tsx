import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coins, Download, Globe, Hourglass, Scale, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import { useCoins, computeStats, coinTitle } from "@/hooks/useCoins";
import { formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import StatTile from "@/components/StatTile";
import EmptyState from "@/components/EmptyState";
import { Reveal, RevealItem } from "@/components/Reveal";
import Geography from "@/components/stats/Geography";
import Decades from "@/components/stats/Decades";
import Composition from "@/components/stats/Composition";
import { GradeDistribution, FormsEdges } from "@/components/stats/Grades";
import { SpendValue, RecentTimeline, PERIODS, filterByPeriod } from "@/components/stats/ValueTimeline";
import type { Period } from "@/components/stats/ValueTimeline";
import Highlights from "@/components/stats/Highlights";

/**
 * /stats — the collection as data, presented like a small museum's annual
 * report (stats.md). All aggregates live from computeStats(useCoins()).
 */
export default function Stats() {
  const coins = useCoins();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("all");

  const stats = useMemo(() => computeStats(coins ?? []), [coins]);

  const scoped = useMemo(() => (coins ? filterByPeriod(coins, period) : []), [coins, period]);
  const scopedSpend = useMemo(
    () => scoped.reduce((s, c) => s + (c.pricePaid ?? 0), 0),
    [scoped],
  );
  const scopedEst = useMemo(
    () => scoped.reduce((s, c) => s + (c.estimatedValue ?? 0), 0),
    [scoped],
  );

  const addedThisMonth = useMemo(() => {
    if (!coins) return 0;
    const now = new Date();
    return coins.filter((c) => {
      const d = new Date(c.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [coins]);

  const oldest = useMemo(() => {
    if (!coins) return undefined;
    const dated = coins.filter((c) => c.year != null);
    if (dated.length > 0) return dated.reduce((a, b) => ((a.year ?? 0) <= (b.year ?? 0) ? a : b));
    return coins.find((c) => c.era);
  }, [coins]);

  const oldestYear = useMemo(() => {
    if (!oldest) return 0;
    if (oldest.year != null) return oldest.year;
    const n = parseInt(oldest.era ?? "", 10);
    return Number.isNaN(n) ? 0 : n;
  }, [oldest]);

  if (!coins) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 pt-12 pb-20 md:px-6">
        <div className="h-10 w-64 animate-pulse rounded-md bg-bg-raised" />
        <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-[10px] border border-line bg-bg-raised" />
          ))}
        </div>
      </div>
    );
  }

  if (coins.length === 0) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 pt-12 pb-20 md:px-6">
        <EmptyState
          headline="Statistics appear once you catalogue a coin"
          body="The annual report of your cabinet — geography, decades, metal, condition, and value — is written as you catalogue."
          cta={{ label: "Catalogue your first coin", to: "/scan" }}
          secondaryCta={{ label: "Add manually", to: "/add" }}
        />
      </div>
    );
  }

  const topCountry = stats.byCountry[0];
  const estDelta = stats.totalEstimated - stats.totalSpend;
  const estDeltaPct = stats.totalSpend > 0 ? Math.round((estDelta / stats.totalSpend) * 100) : 0;

  const exportReport = () => {
    const report = {
      generator: "NUMISMA statistics report",
      generatedAt: new Date().toISOString(),
      period,
      totals: {
        entries: stats.total,
        verified: stats.verified,
        pending: stats.pending,
        draft: stats.draft,
        countries: stats.countries.length,
        totalSpend: stats.totalSpend,
        totalEstimated: stats.totalEstimated,
        periodSpend: scopedSpend,
        periodEstimated: scopedEst,
      },
      byCountry: stats.byCountry,
      byDecade: stats.byDecade,
      byComposition: stats.byComposition,
      byGrade: stats.byGrade,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `numisma-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported", { description: `${stats.total} entries · ${stats.countries.length} issuers` });
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-12 pb-20 md:px-6">
      {/* Page header */}
      <Reveal>
        <RevealItem>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-8">
            <div>
              <div className="flex items-center gap-3">
                <span aria-hidden className="h-px w-6 bg-brass" />
                <span className="overline-label">The collection in numbers</span>
              </div>
              <h1 className="mt-3 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.015em] text-ink md:text-[40px]">
                Statistics
              </h1>
              <p className="mt-2 max-w-[52ch] font-serif text-[16px] leading-[1.65] text-ink-dim">
                A living summary of the cabinet — updated as you catalogue.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div
                role="group"
                aria-label="Period"
                className="flex rounded-md border border-line bg-bg-inset p-0.5"
              >
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPeriod(p.key)}
                    aria-pressed={period === p.key}
                    className={cn(
                      "rounded-[5px] px-3 py-1.5 font-mono text-[12px] font-medium uppercase tracking-[0.08em] transition-colors",
                      period === p.key ? "bg-brass text-[#131009]" : "text-ink-dim hover:text-ink",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={exportReport}
                className="inline-flex items-center gap-2 rounded-md border border-line bg-transparent px-3.5 py-2 font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong hover:text-brass"
              >
                <Download className="size-4" aria-hidden /> Export report
              </button>
            </div>
          </div>
        </RevealItem>
      </Reveal>

      {/* Row 1 — KPI tiles */}
      <Reveal stagger={0.1} className={cn("grid grid-cols-2 gap-5", stats.pending > 0 ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
        <RevealItem>
          <StatTile
            label="Total entries"
            value={stats.total}
            icon={Coins}
            caption={addedThisMonth > 0 ? `+${addedThisMonth} THIS MONTH` : `${stats.verified} VERIFIED`}
            className="h-full rounded-[10px] border border-line bg-bg-raised"
          />
        </RevealItem>
        <RevealItem>
          <StatTile
            label="Countries & issuers"
            value={stats.countries.length}
            icon={Globe}
            caption={topCountry ? `MOST: ${topCountry.name.toUpperCase()} (${topCountry.count})` : undefined}
            className="h-full rounded-[10px] border border-line bg-bg-raised"
          />
        </RevealItem>
        <RevealItem>
          <StatTile
            label="Combined est. value"
            value={stats.totalEstimated}
            format={(n) => formatMoney(n)}
            icon={Scale}
            caption={
              stats.totalSpend > 0
                ? `PAID ${formatMoney(stats.totalSpend)} · ${estDeltaPct >= 0 ? "+" : ""}${estDeltaPct}%`
                : undefined
            }
            className="h-full rounded-[10px] border border-line bg-bg-raised"
          />
        </RevealItem>
        <RevealItem>
          <StatTile
            label="Oldest piece"
            value={oldestYear}
            format={(n) => (oldest?.year != null ? String(Math.round(n)) : `c. ${Math.round(n)} AD`)}
            icon={Hourglass}
            caption={oldest ? coinTitle(oldest).toUpperCase() : "UNDATED"}
            onClick={oldest ? () => navigate(`/coin/${oldest.id}`) : undefined}
            className="h-full rounded-[10px] border border-line bg-bg-raised"
          />
        </RevealItem>
        {stats.pending > 0 && (
          <RevealItem>
            <StatTile
              label="Pending review"
              value={stats.pending}
              icon={ScanSearch}
              accent="copper"
              caption="TAP TO FILTER"
              onClick={() => navigate("/collection?status=pending")}
              className="h-full rounded-[10px] border border-line bg-bg-raised"
            />
          </RevealItem>
        )}
      </Reveal>

      {/* Row 2 — Countries + Decades */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.35fr]">
        <Reveal><RevealItem><Geography byCountry={stats.byCountry} /></RevealItem></Reveal>
        <Reveal><RevealItem><Decades byDecade={stats.byDecade} /></RevealItem></Reveal>
      </div>

      {/* Row 3 — Composition + Grade + Forms */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Reveal><RevealItem><Composition byComposition={stats.byComposition} /></RevealItem></Reveal>
        <Reveal><RevealItem><GradeDistribution coins={coins} /></RevealItem></Reveal>
        <Reveal><RevealItem><FormsEdges coins={coins} /></RevealItem></Reveal>
      </div>

      {/* Row 4 — Spend vs value + timeline */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Reveal><RevealItem><SpendValue coins={coins} period={period} /></RevealItem></Reveal>
        <Reveal><RevealItem><RecentTimeline coins={coins} /></RevealItem></Reveal>
      </div>

      {/* Row 5 — Cabinet records */}
      <Reveal className="mt-12">
        <RevealItem>
          <div className="mb-6 flex items-center gap-3">
            <span aria-hidden className="h-px w-6 bg-brass" />
            <span className="overline-label">Cabinet records</span>
            <span aria-hidden className="h-px flex-1 bg-line" />
            <span className="font-mono text-[11px] text-ink-faint">{formatNumber(stats.total)} pieces considered</span>
          </div>
        </RevealItem>
        <RevealItem>
          <Highlights coins={coins} />
        </RevealItem>
      </Reveal>
    </div>
  );
}
