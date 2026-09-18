import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Coin, CoinStatus } from "@/types/coin";
import { computeStats, filterCoins } from "@/lib/coin-utils";
import { cn } from "@/lib/utils";
import StatusDot from "@/components/coin/StatusDot";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { applyFacets, toggleValue, toggleStatus, activeFilterCount, GRADE_STOPS } from "./filters";
import type { Facets, FacetGroup } from "./filters";

/**
 * Facet sidebar content (collection.md) — shared between the desktop left
 * rail and the mobile filter sheet. Checking an option filters instantly;
 * option counts recompute excluding their own facet group.
 */

export interface FacetPanelProps {
  /** Coins after search, before facet filtering. */
  searched: Coin[];
  value: Facets;
  onChange: (patch: Partial<Facets>) => void;
  onClear: () => void;
}

function Count({ n }: { n: number }) {
  return <span className="tabular ml-auto font-mono text-[11px] text-ink-faint">{n}</span>;
}

function FacetRow({
  checked,
  onToggle,
  children,
  count,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-r-md border-l-2 py-1.5 pl-2 pr-1 transition-colors",
        checked ? "border-brass bg-brass/5" : "border-transparent hover:bg-bg-raised/60",
      )}
    >
      <Checkbox checked={checked} onCheckedChange={onToggle} className="border-line-strong" />
      <span className="flex min-w-0 flex-1 items-center gap-2 font-mono text-[13px] text-ink">{children}</span>
      <Count n={count} />
    </label>
  );
}

export default function FacetPanel({ searched, value, onChange, onClear }: FacetPanelProps) {
  const [countryQuery, setCountryQuery] = useState("");
  const [showAllCountries, setShowAllCountries] = useState(false);

  /** Counts for a facet group are computed against the set filtered by all OTHER groups. */
  const excluding = (g: FacetGroup) => applyFacets(searched, value, g);

  const stats = useMemo(() => computeStats(searched), [searched]);

  const statusCounts = useMemo(() => {
    const base = excluding("status");
    return {
      verified: filterCoins(base, { status: "verified" }).length,
      pending: filterCoins(base, { status: "pending" }).length,
      draft: filterCoins(base, { status: "draft" }).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searched, value]);

  const countryCounts = useMemo(() => {
    const base = excluding("country");
    const map = new Map<string, number>();
    for (const { name } of stats.byCountry) {
      const n = filterCoins(base, { country: name }).length;
      if (n > 0 || value.countries.includes(name)) map.set(name, n);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searched, value, stats]);

  const decadeCounts = useMemo(() => {
    const base = excluding("decade");
    return stats.byDecade
      .map(({ name }) => ({ name, count: filterCoins(base, { decade: name }).length }))
      .filter((d) => d.count > 0 || value.decades.includes(d.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searched, value, stats]);

  const compositionCounts = useMemo(() => {
    const base = excluding("composition");
    return stats.byComposition
      .map(({ name }) => ({ name, count: filterCoins(base, { composition: name }).length }))
      .filter((c) => c.count > 0 || value.compositions.includes(c.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searched, value, stats]);

  /** Denominations grouped by currency (collection.md facet 5). */
  const denominationGroups = useMemo(() => {
    const base = excluding("denomination");
    const groups = new Map<string, Map<string, number>>();
    for (const c of base) {
      const cur = c.currency ?? "Other";
      if (!groups.has(cur)) groups.set(cur, new Map());
      const g = groups.get(cur)!;
      g.set(c.denomination, (g.get(c.denomination) ?? 0) + 1);
    }
    // ensure selected denominations remain visible
    for (const d of value.denominations) {
      const coin = searched.find((c) => c.denomination === d);
      const cur = coin?.currency ?? "Other";
      if (!groups.has(cur)) groups.set(cur, new Map());
      if (!groups.get(cur)!.has(d)) groups.get(cur)!.set(d, 0);
    }
    return [...groups.entries()]
      .map(([currency, denoms]) => ({
        currency,
        denoms: [...denoms.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
      }))
      .sort((a, b) => a.currency.localeCompare(b.currency));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searched, value]);

  const tagCounts = useMemo(() => {
    const base = excluding("tag");
    return stats.tags
      .map((t) => ({ name: t, count: filterCoins(base, { tags: [t] }).length }))
      .filter((t) => t.count > 0 || value.tags.includes(t.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searched, value, stats]);

  const yearBounds = useMemo(() => {
    const years = searched.map((c) => c.year).filter((y): y is number => y != null);
    if (!years.length) return [1800, new Date().getFullYear()] as [number, number];
    return [Math.min(...years), Math.max(...years)] as [number, number];
  }, [searched]);

  const gradeStopIndex = Math.max(
    0,
    GRADE_STOPS.findIndex((_, i) => i === GRADE_STOPS.length - 1 || GRADE_STOPS[i + 1].rank > value.gradeMin),
  );
  const activeGrade = GRADE_STOPS[gradeStopIndex] ?? GRADE_STOPS[0];

  const filteredCountries = countryCounts.filter(([name]) =>
    name.toLowerCase().includes(countryQuery.trim().toLowerCase()),
  );
  const visibleCountries = showAllCountries ? filteredCountries : filteredCountries.slice(0, 8);
  const nActive = activeFilterCount(value);
  const [yLo, yHi] = yearBounds;
  const yearValue: [number, number] = [value.yearMin ?? yLo, value.yearMax ?? yHi];

  const section = "border-b border-line/50 py-5";

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <Accordion type="multiple" defaultValue={["status", "country"]} className="w-full">
          {/* Status */}
          <AccordionItem value="status" className="border-b-0">
            <AccordionTrigger className="py-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint hover:no-underline">
              Status
            </AccordionTrigger>
            <AccordionContent className={cn(section, "pt-1")}>
              {(["verified", "pending", "draft"] as CoinStatus[]).map((s) => (
                <FacetRow
                  key={s}
                  checked={value.statuses.includes(s)}
                  onToggle={() => onChange({ statuses: toggleStatus(value.statuses, s) })}
                  count={statusCounts[s]}
                >
                  <StatusDot status={s} label />
                </FacetRow>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Country */}
          <AccordionItem value="country" className="border-b-0">
            <AccordionTrigger className="py-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint hover:no-underline">
              Country / Issuer
            </AccordionTrigger>
            <AccordionContent className={cn(section, "pt-1")}>
              {countryCounts.length > 6 && (
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
                  <Input
                    value={countryQuery}
                    onChange={(e) => setCountryQuery(e.target.value)}
                    placeholder="Filter countries…"
                    className="h-8 border-line bg-bg-inset pl-8 font-mono text-[12px]"
                  />
                </div>
              )}
              {visibleCountries.map(([name, n]) => (
                <FacetRow
                  key={name}
                  checked={value.countries.includes(name)}
                  onToggle={() => onChange({ countries: toggleValue(value.countries, name) })}
                  count={n}
                >
                  <span className="truncate">{name}</span>
                </FacetRow>
              ))}
              {filteredCountries.length > 8 && (
                <button
                  type="button"
                  onClick={() => setShowAllCountries((s) => !s)}
                  className="mt-1 font-mono text-[12px] text-brass hover:text-brass-bright"
                >
                  {showAllCountries ? "Show fewer" : `Show all (${filteredCountries.length})`}
                </button>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Decade */}
          <AccordionItem value="decade" className="border-b-0">
            <AccordionTrigger className="py-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint hover:no-underline">
              Decade / Era
            </AccordionTrigger>
            <AccordionContent className={cn(section, "pt-1")}>
              <div className="grid grid-cols-3 gap-1.5">
                {decadeCounts.map(({ name, count }) => {
                  const on = value.decades.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      aria-pressed={on}
                      onClick={() => onChange({ decades: toggleValue(value.decades, name) })}
                      className={cn(
                        "rounded-md border px-1.5 py-1.5 text-center font-mono text-[11px] transition-colors",
                        on
                          ? "border-brass bg-brass/10 text-brass"
                          : "border-line text-ink-dim hover:border-line-strong hover:text-ink",
                      )}
                    >
                      {name}
                      <span className="tabular ml-1 text-ink-faint">{count}</span>
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Composition */}
          <AccordionItem value="composition" className="border-b-0">
            <AccordionTrigger className="py-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint hover:no-underline">
              Composition
            </AccordionTrigger>
            <AccordionContent className={cn(section, "pt-1")}>
              {compositionCounts.map(({ name, count }) => (
                <FacetRow
                  key={name}
                  checked={value.compositions.includes(name)}
                  onToggle={() => onChange({ compositions: toggleValue(value.compositions, name) })}
                  count={count}
                >
                  <span className="truncate">{name}</span>
                </FacetRow>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Denomination */}
          <AccordionItem value="denomination" className="border-b-0">
            <AccordionTrigger className="py-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint hover:no-underline">
              Denomination / Currency
            </AccordionTrigger>
            <AccordionContent className={cn(section, "pt-1")}>
              {denominationGroups.map((g) => (
                <div key={g.currency} className="mb-2 last:mb-0">
                  <div className="overline-label mb-1 text-[10px]">{g.currency}</div>
                  {g.denoms.map(([name, n]) => (
                    <FacetRow
                      key={name}
                      checked={value.denominations.includes(name)}
                      onToggle={() => onChange({ denominations: toggleValue(value.denominations, name) })}
                      count={n}
                    >
                      <span className="truncate">{name}</span>
                    </FacetRow>
                  ))}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Grade */}
          <AccordionItem value="grade" className="border-b-0">
            <AccordionTrigger className="py-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint hover:no-underline">
              Grade
            </AccordionTrigger>
            <AccordionContent className={cn(section, "pt-1")}>
              <Slider
                min={0}
                max={GRADE_STOPS.length - 1}
                step={1}
                value={[gradeStopIndex]}
                onValueChange={([i]) => onChange({ gradeMin: GRADE_STOPS[i]?.rank ?? 0 })}
                className="my-3"
              />
              <div className="flex items-center justify-between font-mono text-[12px]">
                <span className="text-ink-faint">G</span>
                <span className="text-brass">
                  {activeGrade.rank === 0 ? "Any grade" : `≥ ${activeGrade.label}`}
                </span>
                <span className="text-ink-faint">MS</span>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Year range */}
          <AccordionItem value="year" className="border-b-0">
            <AccordionTrigger className="py-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint hover:no-underline">
              Year Range
            </AccordionTrigger>
            <AccordionContent className={cn(section, "pt-1")}>
              <Slider
                min={yLo}
                max={Math.max(yHi, yLo + 1)}
                step={1}
                value={yearValue}
                onValueChange={([lo, hi]) =>
                  onChange({
                    yearMin: lo <= yLo ? null : lo,
                    yearMax: hi >= yHi ? null : hi,
                  })
                }
                className="my-3"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={value.yearMin ?? ""}
                  placeholder={String(yLo)}
                  onChange={(e) => onChange({ yearMin: e.target.value ? Number(e.target.value) : null })}
                  className="h-8 border-line bg-bg-inset font-mono text-[12px]"
                />
                <span className="font-mono text-[12px] text-ink-faint">–</span>
                <Input
                  type="number"
                  value={value.yearMax ?? ""}
                  placeholder={String(yHi)}
                  onChange={(e) => onChange({ yearMax: e.target.value ? Number(e.target.value) : null })}
                  className="h-8 border-line bg-bg-inset font-mono text-[12px]"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Tags */}
          {tagCounts.length > 0 && (
            <AccordionItem value="tags" className="border-b-0">
              <AccordionTrigger className="py-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint hover:no-underline">
                Tags
              </AccordionTrigger>
              <AccordionContent className={cn(section, "pt-1")}>
                <div className="flex flex-wrap gap-1.5">
                  {tagCounts.map(({ name, count }) => {
                    const on = value.tags.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onChange({ tags: toggleValue(value.tags, name) })}
                        className={cn(
                          "rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors",
                          on
                            ? "border-brass bg-brass/10 text-brass"
                            : "border-line text-ink-dim hover:border-line-strong hover:text-ink",
                        )}
                      >
                        #{name}
                        <span className="tabular ml-1 text-ink-faint">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>

      {/* footer */}
      <div className="flex items-center justify-between gap-3 pt-4">
        <button
          type="button"
          onClick={onClear}
          className={cn(
            "font-mono text-[12px] uppercase tracking-[0.12em] transition-colors",
            nActive > 0 ? "text-oxblood hover:text-oxblood/80" : "text-ink-faint hover:text-ink-dim",
          )}
        >
          Clear all
        </button>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
          {nActive} filter{nActive === 1 ? "" : "s"} active
        </span>
      </div>
    </div>
  );
}
