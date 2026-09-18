import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { NameCount } from "@/hooks/useCoins";
import { formatNumber } from "@/lib/format";
import { StatCard } from "@/components/stats/theme";

const TOP_N = 8;

/**
 * Countries & issuers (stats.md Row 2A): horizontal bar list, top 8 + Other.
 * Whole row is a link to the filtered collection; fill animates 0→width.
 */
export default function Geography({ byCountry }: { byCountry: NameCount[] }) {
  const navigate = useNavigate();
  const top = byCountry.slice(0, TOP_N);
  const rest = byCountry.slice(TOP_N);
  const rows: NameCount[] =
    rest.length > 0
      ? [...top, { name: "Other", count: rest.reduce((sum, r) => sum + r.count, 0) }]
      : top;
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <StatCard overline="GEOGRAPHY" title="Countries & issuers">
      <ul className="space-y-2.5">
        {rows.map((row, i) => {
          const pct = Math.max(3, (row.count / max) * 100);
          const to =
            row.name === "Other" ? "/collection" : `/collection?country=${encodeURIComponent(row.name)}`;
          return (
            <li key={row.name}>
              <motion.button
                type="button"
                onClick={() => navigate(to)}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group flex w-full items-center gap-3 text-left"
              >
                <span className="w-28 shrink-0 truncate font-mono text-[13px] text-ink-dim transition-colors group-hover:text-ink">
                  {row.name}
                </span>
                <span className="relative h-[22px] flex-1 overflow-hidden rounded-sm bg-bg-inset">
                  <motion.span
                    aria-hidden
                    className="absolute inset-y-0 left-0 rounded-sm bg-brass transition-colors group-hover:bg-brass-bright"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.8, delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>
                <span className="tabular w-9 shrink-0 text-right font-mono text-[13px] text-brass">
                  {formatNumber(row.count)}
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
        {formatNumber(byCountry.length)} issuers total · showing top {Math.min(TOP_N, byCountry.length)}
        {rest.length > 0 ? ` + other` : ""}
      </p>
    </StatCard>
  );
}
