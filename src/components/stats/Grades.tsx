import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Coin } from "@/types/coin";
import { gradeRank } from "@/hooks/useCoins";
import { formatNumber } from "@/lib/format";
import { StatCard, INK_FAINT } from "@/components/stats/theme";

/**
 * Grade distribution (stats.md Row 3): ordered buckets G–F → UNC/MS with a
 * darker→brighter brass ramp, UNGRADED last in ink-faint. Median grade footer.
 */

const BUCKETS = ["G–F", "VF", "EF", "AU", "UNC/MS", "UNGRADED"] as const;
type Bucket = (typeof BUCKETS)[number];

function bucketOf(rank: number): Bucket {
  if (rank < 0) return "UNGRADED";
  if (rank < 20) return "G–F";
  if (rank < 40) return "VF";
  if (rank < 50) return "EF";
  if (rank < 60) return "AU";
  return "UNC/MS";
}

/** Brass ramp darker→brighter with grade; ungraded = ink-faint. */
const BUCKET_FILL: Record<Bucket, string> = {
  "G–F": "rgba(201,162,75,0.40)",
  VF: "rgba(201,162,75,0.58)",
  EF: "rgba(201,162,75,0.74)",
  AU: "rgba(201,162,75,0.88)",
  "UNC/MS": "#E5C57A",
  UNGRADED: "rgba(124,111,87,0.45)",
};

export function GradeDistribution({ coins }: { coins: Coin[] }) {
  const { counts, median } = useMemo(() => {
    const counts = new Map<Bucket, number>(BUCKETS.map((b) => [b, 0]));
    const graded: { rank: number; grade: string }[] = [];
    for (const c of coins) {
      const rank = gradeRank(c.grade);
      counts.set(bucketOf(rank), (counts.get(bucketOf(rank)) ?? 0) + 1);
      if (c.grade && rank >= 0) graded.push({ rank, grade: c.grade });
    }
    graded.sort((a, b) => a.rank - b.rank);
    const median = graded.length > 0 ? graded[Math.floor((graded.length - 1) / 2)].grade : undefined;
    return { counts, median };
  }, [coins]);

  const max = Math.max(1, ...BUCKETS.map((b) => counts.get(b) ?? 0));

  return (
    <StatCard overline="CONDITION" title="Grade distribution">
      <div className="flex h-[190px] items-end gap-3">
        {BUCKETS.map((b, i) => {
          const n = counts.get(b) ?? 0;
          const pct = (n / max) * 100;
          return (
            <div key={b} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="tabular font-mono text-[11px] text-ink-dim">{n > 0 ? formatNumber(n) : ""}</span>
              <motion.div
                className="w-full rounded-t-[3px]"
                style={{ background: BUCKET_FILL[b] }}
                initial={{ height: 0 }}
                whileInView={{ height: `${Math.max(n > 0 ? 4 : 0, pct)}%` }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-faint">{b}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
        {median ? `Median grade: ${median}` : "No grades recorded yet"}
      </p>
    </StatCard>
  );
}

/* ------------------------------ Forms & edges ----------------------------- */

/** Tiny outline glyphs for common shapes (currentColor stroke). */
function ShapeGlyph({ shape }: { shape: string }) {
  const s = shape.toLowerCase();
  const common = "size-4 text-bronze";
  if (s.includes("scall")) {
    return (
      <svg viewBox="0 0 16 16" className={common} aria-hidden>
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.2 1.4" />
      </svg>
    );
  }
  if (s.includes("square") || s.includes("rect")) {
    return (
      <svg viewBox="0 0 16 16" className={common} aria-hidden>
        <rect x="2.5" y="2.5" width="11" height="11" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (s.includes("hex") || s.includes("dodec") || s.includes("gon") || s.includes("sided")) {
    return (
      <svg viewBox="0 0 16 16" className={common} aria-hidden>
        <polygon points="8,1.5 13.6,4.75 13.6,11.25 8,14.5 2.4,11.25 2.4,4.75" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (s.includes("hole") || s.includes("ring") || s.includes("annul")) {
    return (
      <svg viewBox="0 0 16 16" className={common} aria-hidden>
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8" cy="8" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  // round / default
  return (
    <svg viewBox="0 0 16 16" className={common} aria-hidden>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/** Tiny edge cross-section motifs. */
function EdgeGlyph({ edge }: { edge: string }) {
  const e = edge.toLowerCase();
  const common = "h-3.5 w-6 text-bronze";
  if (e.includes("reed") || e.includes("mill")) {
    return (
      <svg viewBox="0 0 24 14" className={common} aria-hidden>
        <rect x="1" y="2" width="22" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        {[5, 9, 13, 17, 21].map((x) => (
          <line key={x} x1={x - 1} y1="2" x2={x - 1} y2="12" stroke="currentColor" strokeWidth="1" />
        ))}
      </svg>
    );
  }
  if (e.includes("letter") || e.includes("inscri") || e.includes("incuse")) {
    return (
      <svg viewBox="0 0 24 14" className={common} aria-hidden>
        <rect x="1" y="2" width="22" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        {[4, 9, 14, 19].map((x) => (
          <rect key={x} x={x} y="5.5" width="2" height="3" fill="currentColor" />
        ))}
      </svg>
    );
  }
  if (e.includes("groove") || e.includes("secur")) {
    return (
      <svg viewBox="0 0 24 14" className={common} aria-hidden>
        <rect x="1" y="2" width="22" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="1" y1="7" x2="23" y2="7" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  // smooth / plain / default
  return (
    <svg viewBox="0 0 24 14" className={common} aria-hidden>
      <rect x="1" y="2" width="22" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

interface TallyRow {
  name: string;
  count: number;
  pct: number;
}

function tallyField(coins: Coin[], pick: (c: Coin) => string | undefined): TallyRow[] {
  const map = new Map<string, number>();
  let withValue = 0;
  for (const c of coins) {
    const raw = pick(c)?.trim();
    if (!raw) continue;
    withValue++;
    const name = raw[0].toUpperCase() + raw.slice(1).toLowerCase();
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count, pct: withValue > 0 ? Math.round((count / withValue) * 100) : 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 5);
}

/** Forms & edges (stats.md Row 3): two mini-lists with glyphs and % meters. */
export function FormsEdges({ coins }: { coins: Coin[] }) {
  const shapes = useMemo(() => tallyField(coins, (c) => c.shape), [coins]);
  const edges = useMemo(() => tallyField(coins, (c) => c.edge), [coins]);

  const list = (rows: TallyRow[], kind: "shape" | "edge") =>
    rows.length === 0 ? (
      <p className="py-3 font-serif text-[14px] italic text-ink-faint">None recorded yet.</p>
    ) : (
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <motion.li
            key={r.name}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="flex items-center gap-2.5"
          >
            {kind === "shape" ? <ShapeGlyph shape={r.name} /> : <EdgeGlyph edge={r.name} />}
            <span className="w-24 shrink-0 truncate font-mono text-[12px] text-ink-dim">{r.name}</span>
            <span className="relative h-px flex-1 bg-line">
              <span aria-hidden className="absolute inset-y-0 left-0 -my-px h-[3px] bg-brass/70" style={{ width: `${r.pct}%` }} />
            </span>
            <span className="tabular w-10 shrink-0 text-right font-mono text-[11px]" style={{ color: INK_FAINT }}>
              {r.pct}%
            </span>
          </motion.li>
        ))}
      </ul>
    );

  return (
    <StatCard overline="FORMS" title="Shapes & edges">
      <div className="space-y-6">
        <div>
          <p className="overline-label mb-3">Shapes</p>
          {list(shapes, "shape")}
        </div>
        <div>
          <p className="overline-label mb-3">Edges</p>
          {list(edges, "edge")}
        </div>
      </div>
    </StatCard>
  );
}
