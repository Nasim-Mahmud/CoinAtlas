import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NameCount } from "@/hooks/useCoins";
import { StatCard, ChartTooltip, AXIS_TICK, BRASS, PATINA, LINE } from "@/components/stats/theme";

/**
 * Coins by decade (stats.md Row 2B): recharts histogram, brass bars with
 * radius [3,3,0,0]; "Ancient"/non-decade buckets render in patina at the far
 * left (sorted first by computeStats). Clicking a bar filters the collection.
 */
export default function Decades({ byDecade }: { byDecade: NameCount[] }) {
  const navigate = useNavigate();
  const isAncient = (name: string) => Number.isNaN(parseInt(name, 10));

  if (byDecade.length === 1) {
    // Single data point → centered numeral callout (stats.md Notes).
    const only = byDecade[0];
    return (
      <StatCard overline="TIME" title="Coins by decade">
        <div className="flex flex-col items-center py-10 text-center">
          <div className="tabular font-display text-[44px] font-semibold leading-none text-brass">{only.count}</div>
          <div className="overline-label mt-2">pieces · {only.name}</div>
        </div>
      </StatCard>
    );
  }

  return (
    <StatCard overline="TIME" title="Coins by decade">
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byDecade} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
            <CartesianGrid vertical={false} stroke={LINE} strokeOpacity={0.5} />
            <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: LINE }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={34} />
            <Tooltip
              cursor={{ fill: "rgba(201,162,75,0.08)" }}
              content={<ChartTooltip renderEntry={(e) => `${e.value ?? 0} coins`} />}
            />
            <Bar
              dataKey="count"
              name="Coins"
              radius={[3, 3, 0, 0]}
              onClick={(data) => {
                const name = (data as unknown as NameCount).name;
                if (name) navigate(`/collection?decade=${encodeURIComponent(name)}`);
              }}
              className="cursor-pointer"
            >
              {byDecade.map((d) => (
                <Cell key={d.name} fill={isAncient(d.name) ? PATINA : BRASS} fillOpacity={isAncient(d.name) ? 0.9 : 0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
        {byDecade.some((d) => isAncient(d.name)) ? "Patina bar · ancient & undated pieces · " : ""}click a bar to filter the collection
      </p>
    </StatCard>
  );
}
