import { useState } from "react";
import { cn } from "@/lib/utils";
import { ANATOMY_TERMS } from "@/components/reference/content";
import { Highlight, matchesQuery } from "@/components/reference/Highlight";

/**
 * Section 2 — Anatomy (reference.md): inline SVG line drawing of a coin face
 * with callout lines, paired with definition rows. Hovering either side
 * highlights the other in brass.
 */

const INK_FAINT = "#7C6F57";
const LINE_STRONG = "#4A3C26";
const BRASS = "#C9A24B";
const MONO = '"IBM Plex Mono", ui-monospace, monospace';

interface Callout {
  key: string;
  label: string;
  lx: number;
  ly: number;
  px: number;
  py: number;
}

const CALLOUTS: Callout[] = [
  { key: "reverse", label: "Reverse", lx: 16, ly: 34, px: 104, py: 86 },
  { key: "legend", label: "Legend", lx: 16, ly: 94, px: 143, py: 148 },
  { key: "device", label: "Portrait / Device", lx: 16, ly: 158, px: 188, py: 172 },
  { key: "field", label: "Field", lx: 16, ly: 222, px: 258, py: 158 },
  { key: "relief", label: "Relief", lx: 16, ly: 286, px: 222, py: 205 },
  { key: "obverse", label: "Obverse", lx: 16, ly: 350, px: 155, py: 255 },
  { key: "rim", label: "Rim", lx: 312, ly: 62, px: 283, py: 122 },
  { key: "edge", label: "Edge", lx: 332, ly: 118, px: 320, py: 195 },
  { key: "date", label: "Date", lx: 330, ly: 242, px: 216, py: 276 },
  { key: "mintmark", label: "Mint mark", lx: 330, ly: 286, px: 246, py: 280 },
  { key: "exergue", label: "Exergue", lx: 330, ly: 330, px: 256, py: 260 },
];

function CoinDiagram({ active, setActive }: { active: string | null; setActive: (k: string | null) => void }) {
  return (
    <svg viewBox="0 0 420 392" className="w-full max-w-[460px]" role="img" aria-label="Diagram of a coin's anatomy">
      <defs>
        <path id="legend-arc" d="M 128 195 A 82 82 0 0 1 292 195" fill="none" />
      </defs>

      {/* reverse peeking behind (dashed) */}
      <circle cx="180" cy="168" r="110" fill="none" stroke={active === "reverse" ? BRASS : LINE_STRONG} strokeWidth="1.2" strokeDasharray="4 5" opacity={active === "reverse" ? 1 : 0.6} />

      {/* face */}
      <circle cx="210" cy="195" r="110" fill="rgba(14,11,7,0.55)" stroke={LINE_STRONG} strokeWidth="1.4" />
      <circle cx="210" cy="195" r="96" fill="none" stroke={active === "rim" ? BRASS : LINE_STRONG} strokeWidth="1.2" />

      {/* legend on arc */}
      <text fontFamily={MONO} fontSize="10.5" letterSpacing="3.5" fill={active === "legend" ? BRASS : INK_FAINT}>
        <textPath href="#legend-arc" startOffset="50%" textAnchor="middle">
          NUMISMA · REIPVBLICAE
        </textPath>
      </text>

      {/* bust silhouette (device / relief) */}
      <path
        d="M 172 242 C 176 218 192 208 198 197 C 192 188 190 176 194 164 C 200 149 222 149 228 164 C 232 176 230 188 224 197 C 230 208 246 218 250 242 Z"
        fill="none"
        stroke={active === "device" || active === "relief" ? BRASS : LINE_STRONG}
        strokeWidth="1.4"
      />
      {/* relief shading ticks on the bust */}
      <path d="M 200 170 L 208 162 M 204 182 L 214 174" stroke={active === "relief" ? BRASS : INK_FAINT} strokeWidth="1" opacity="0.8" />

      {/* exergue line + date + mint mark */}
      <line x1="165" y1="260" x2="255" y2="260" stroke={active === "exergue" ? BRASS : LINE_STRONG} strokeWidth="1.2" />
      <text x="208" y="282" textAnchor="middle" fontFamily={MONO} fontSize="13" letterSpacing="2" fill={active === "date" ? BRASS : INK_FAINT}>
        1999
      </text>
      <text x="246" y="282" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={active === "mintmark" ? BRASS : INK_FAINT}>
        S
      </text>

      {/* callouts */}
      {CALLOUTS.map((c) => {
        const on = active === c.key;
        const color = on ? BRASS : INK_FAINT;
        const startX = c.lx < 210 ? c.lx + Math.min(c.label.length * 6.4 + 6, 130) : c.lx - 6;
        return (
          <g
            key={c.key}
            onMouseEnter={() => setActive(c.key)}
            onMouseLeave={() => setActive(null)}
            className="cursor-pointer"
            style={{ transition: "opacity 0.15s" }}
            opacity={active == null || on ? 1 : 0.45}
          >
            <line x1={startX} y1={c.ly - 3} x2={c.px} y2={c.py} stroke={color} strokeWidth="1" strokeDasharray={on ? "none" : "2 3"} />
            <circle cx={c.px} cy={c.py} r={on ? 3.4 : 2.4} fill={color} />
            <text x={c.lx} y={c.ly} fontFamily={MONO} fontSize="9.5" letterSpacing="1.5" fill={color} style={{ textTransform: "uppercase" }}>
              {c.label.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Anatomy({ query }: { query: string }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,460px)_1fr]">
      <div className="rounded-[12px] border border-line bg-bg-inset p-6">
        <CoinDiagram active={active} setActive={setActive} />
        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          Hover a callout — or a term — to connect them
        </p>
      </div>
      <div>
        {ANATOMY_TERMS.map((t) => {
          if (!matchesQuery(query, t.term, t.definition)) return null;
          const on = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onMouseEnter={() => setActive(t.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(t.key)}
              onBlur={() => setActive(null)}
              className={cn(
                "block w-full border-b border-line/50 px-2 py-3 text-left transition-colors duration-150",
                on && "bg-bg-raised",
              )}
            >
              <span className={cn("font-mono text-[13px] font-medium uppercase tracking-[0.06em]", on ? "text-brass" : "text-ink")}>
                <Highlight text={t.term} query={query} />
              </span>
              <span className="mt-0.5 block font-serif text-[14.5px] leading-[1.6] text-ink-dim">
                <Highlight text={t.definition} query={query} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
