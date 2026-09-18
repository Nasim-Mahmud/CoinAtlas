import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { NameCount } from "@/hooks/useCoins";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatCard, ChartTooltip, viz } from "@/components/stats/theme";

/**
 * Composition donut (stats.md Row 3): inner radius 62%, segments in the
 * data-viz cycle, center total, interactive legend (hover isolates a segment,
 * click filters the collection).
 */
export default function Composition({ byComposition }: { byComposition: NameCount[] }) {
  const navigate = useNavigate();
  const [active, setActive] = useState<number | null>(null);
  const total = byComposition.reduce((sum, c) => sum + c.count, 0);

  if (byComposition.length === 0) {
    return (
      <StatCard overline="METAL" title="Composition">
        <p className="py-8 text-center font-serif text-[15px] leading-[1.65] text-ink-dim">
          Record compositions on your entries to see the cabinet's metallurgy.
        </p>
      </StatCard>
    );
  }

  return (
    <StatCard overline="METAL" title="Composition">
      <div className="relative mx-auto h-[190px] w-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip renderEntry={(e) => `${e.name ?? ""} · ${e.value ?? 0}`} />} />
            <Pie
              data={byComposition}
              dataKey="count"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              stroke="none"
              isAnimationActive
              animationDuration={900}
              onClick={(data) => {
                const name = (data as unknown as NameCount).name;
                if (name) navigate(`/collection?composition=${encodeURIComponent(name)}`);
              }}
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className="cursor-pointer"
            >
              {byComposition.map((d, i) => (
                <Cell
                  key={d.name}
                  fill={viz(i)}
                  opacity={active == null || active === i ? 1 : 0.3}
                  style={{ transition: "opacity 0.2s" }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular font-display text-[24px] font-semibold leading-none text-ink">
            {formatNumber(total)}
          </span>
          <span className="overline-label mt-1">pieces</span>
        </div>
      </div>
      <ul className="mt-5 space-y-1.5">
        {byComposition.map((c, i) => {
          const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
          return (
            <li key={c.name}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onClick={() => navigate(`/collection?composition=${encodeURIComponent(c.name)}`)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-1 py-0.5 text-left font-mono text-[12px] transition-opacity",
                  active != null && active !== i ? "opacity-40" : "opacity-100",
                )}
              >
                <span aria-hidden className="inline-block size-2 shrink-0 rounded-full" style={{ background: viz(i) }} />
                <span className="flex-1 truncate text-ink-dim">{c.name}</span>
                <span className="tabular text-ink">{formatNumber(c.count)}</span>
                <span className="tabular w-10 text-right text-ink-faint">{pct}%</span>
              </button>
            </li>
          );
        })}
      </ul>
    </StatCard>
  );
}
