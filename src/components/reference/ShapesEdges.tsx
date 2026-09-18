import { motion } from "framer-motion";
import { SHAPES, EDGES } from "@/components/reference/content";
import type { GlyphItem } from "@/components/reference/content";
import { Highlight, matchesQuery } from "@/components/reference/Highlight";

/**
 * Section 3 — Shapes & edges (reference.md): two glyph cards with inline SVG
 * outline glyphs (currentColor, drawn from simple geometry).
 */

/* ------------------------------ glyph helpers ----------------------------- */

function polar(cx: number, cy: number, r: number, theta: number): [number, number] {
  return [cx + r * Math.cos(theta), cy + r * Math.sin(theta)];
}

function polygonPoints(n: number, cx: number, cy: number, r: number, phase = -Math.PI / 2): string {
  return Array.from({ length: n }, (_, i) => {
    const [x, y] = polar(cx, cy, r, phase + (i * 2 * Math.PI) / n);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

/** Lobed outline (scalloped = many lobes, Spanish flower = 4 lobes). */
function lobedPath(lobes: number, cx: number, cy: number, r: number, amp: number): string {
  const steps = lobes * 16;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    const rr = r * (1 + amp * Math.cos(lobes * theta));
    const [x, y] = polar(cx, cy, rr, theta);
    d += `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d + "Z";
}

function ShapeGlyph({ name }: { name: string }) {
  const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2 };
  switch (name) {
    case "Round":
      return <circle cx="30" cy="30" r="24" {...stroke} />;
    case "Scalloped":
      return <path d={lobedPath(12, 30, 30, 23, 0.09)} {...stroke} />;
    case "Square":
      return <rect x="8" y="8" width="44" height="44" rx="6" {...stroke} />;
    case "Hexagonal":
      return <polygon points={polygonPoints(6, 30, 30, 25)} {...stroke} />;
    case "Dodecagonal":
      return <polygon points={polygonPoints(12, 30, 30, 25)} {...stroke} />;
    case "Holed":
      return (
        <>
          <circle cx="30" cy="30" r="24" {...stroke} />
          <circle cx="30" cy="30" r="8" {...stroke} />
        </>
      );
    case "Spanish flower":
      return <path d={lobedPath(4, 30, 30, 24, 0.14)} {...stroke} />;
    case "Irregular":
      return (
        <path
          d="M 12 14 L 34 7 L 52 16 L 55 36 L 44 52 L 22 54 L 7 40 L 9 24 Z"
          {...stroke}
          strokeLinejoin="round"
        />
      );
    default:
      return <circle cx="30" cy="30" r="24" {...stroke} />;
  }
}

function EdgeGlyph({ name }: { name: string }) {
  const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2 };
  const band = <rect x="4" y="10" width="72" height="20" rx="4" {...stroke} />;
  switch (name) {
    case "Reeded":
      return (
        <>
          {band}
          {Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1={12 + i * 7} y1="10" x2={12 + i * 7} y2="30" stroke="currentColor" strokeWidth="1.6" />
          ))}
        </>
      );
    case "Smooth":
      return band;
    case "Lettered":
      return (
        <>
          {band}
          <text x="40" y="24.5" textAnchor="middle" fontSize="9" letterSpacing="2.5" fill="currentColor" fontFamily='"IBM Plex Mono", monospace'>
            ABC
          </text>
        </>
      );
    case "Grooved":
      return (
        <>
          {band}
          <line x1="4" y1="20" x2="76" y2="20" stroke="currentColor" strokeWidth="2" />
        </>
      );
    case "Interrupted reeding":
      return (
        <>
          {band}
          {[0, 1].map((g) =>
            Array.from({ length: 3 }, (_, i) => (
              <line key={`${g}-${i}`} x1={14 + g * 34 + i * 6} y1="10" x2={14 + g * 34 + i * 6} y2="30" stroke="currentColor" strokeWidth="1.6" />
            )),
          )}
        </>
      );
    case "Security edge":
      return (
        <>
          {band}
          {Array.from({ length: 5 }, (_, i) => (
            <circle key={i} cx={16 + i * 12} cy="20" r="2.4" fill="currentColor" />
          ))}
        </>
      );
    case "Ornamented":
      return (
        <>
          {band}
          <path d="M 10 20 Q 16 13 22 20 T 34 20 T 46 20 T 58 20 T 70 20" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </>
      );
    default:
      return band;
  }
}

/* --------------------------------- cards ---------------------------------- */

function GlyphCard({
  title,
  overline,
  items,
  kind,
  query,
}: {
  title: string;
  overline: string;
  items: GlyphItem[];
  kind: "shape" | "edge";
  query: string;
}) {
  const visible = items.filter((i) => matchesQuery(query, i.name, i.note));
  return (
    <div className="rounded-[12px] border border-line bg-bg-raised p-6">
      <p className="overline-label">{overline}</p>
      <h3 className="mt-2 font-display text-[19px] font-medium text-ink">{title}</h3>
      {visible.length === 0 ? (
        <p className="mt-6 font-serif text-[14.5px] italic text-ink-faint">No matches in this card.</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="group rounded-md border border-line/50 bg-bg-inset p-4 text-center transition-colors hover:border-brass"
              title={item.note}
            >
              <svg
                viewBox={kind === "shape" ? "0 0 60 60" : "0 0 80 40"}
                className="mx-auto h-10 text-ink-dim transition-colors group-hover:text-brass"
                aria-hidden
              >
                {kind === "shape" ? <ShapeGlyph name={item.name} /> : <EdgeGlyph name={item.name} />}
              </svg>
              <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-dim transition-colors group-hover:text-ink">
                <Highlight text={item.name} query={query} />
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShapesEdges({ query }: { query: string }) {
  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        <GlyphCard title="Shapes" overline="Planchet forms" items={SHAPES} kind="shape" query={query} />
        <GlyphCard title="Edges" overline="The third side" items={EDGES} kind="edge" query={query} />
      </div>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
        Use these terms in your entry's shape & edge fields
      </p>
    </div>
  );
}
