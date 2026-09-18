import { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { SvgMask } from "@/components/coin/CoinImage";
import { GRADING_BANDS } from "@/components/reference/content";
import { Highlight, matchesQuery } from "@/components/reference/Highlight";

/**
 * Section 1 — Grading & condition (reference.md): the grading strip with six
 * interactive stops over the seven adjectival bands, definition rows, and the
 * proof callout. Hovering a strip stop highlights its band row and vice versa.
 */

/** Strip stop → band index (strip shows 6 stops; AU folds into the UNC end). */
const STOP_TO_BAND = [0, 1, 2, 3, 4, 6];

export default function Grading({ query }: { query: string }) {
  const [activeBand, setActiveBand] = useState<number | null>(null);

  return (
    <div>
      <p className="max-w-[68ch] font-serif text-[16px] leading-[1.65] text-ink-dim">
        Condition drives value. Numisma uses the Sheldon scale (1–70) with adjectival bands — grade
        conservatively, and note flaws in your entry's notes.
      </p>

      {/* Grading strip with hover stops */}
      <div className="relative mt-8">
        <SvgMask
          src="/ref-grading-strip.svg"
          className="w-full text-bronze"
          style={{ aspectRatio: "5 / 1" }}
        />
        <div className="absolute inset-0 flex" aria-hidden={false}>
          {STOP_TO_BAND.map((bandIdx, stop) => (
            <button
              key={stop}
              type="button"
              aria-label={`Highlight band ${GRADING_BANDS[bandIdx].name}`}
              onMouseEnter={() => setActiveBand(bandIdx)}
              onMouseLeave={() => setActiveBand(null)}
              onFocus={() => setActiveBand(bandIdx)}
              onBlur={() => setActiveBand(null)}
              className="h-full flex-1 cursor-pointer"
            />
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
        <span>Worn</span>
        <span>As struck</span>
      </div>

      {/* Band table */}
      <div className="mt-6">
        {GRADING_BANDS.map((band, i) => {
          if (!matchesQuery(query, band.code, band.name, band.description)) return null;
          const active = activeBand === i;
          return (
            <div
              key={band.code}
              onMouseEnter={() => setActiveBand(i)}
              onMouseLeave={() => setActiveBand(null)}
              className={cn(
                "relative grid grid-cols-1 gap-1 border-b border-line/50 px-3 py-4 transition-colors duration-200 sm:grid-cols-[180px_1fr] sm:items-baseline sm:gap-4",
                active ? "bg-bg-raised" : "bg-transparent",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full bg-brass transition-opacity duration-200",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <div className="flex items-baseline gap-2.5">
                <span className={cn("tabular font-mono text-[13px] font-semibold", active ? "text-brass" : "text-ink")}>
                  <Highlight text={band.code} query={query} />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                  <Highlight text={band.name} query={query} />
                </span>
                <span className="tabular font-mono text-[10px] text-ink-faint">{band.sheldon}</span>
              </div>
              <p className="font-serif text-[15px] leading-[1.6] text-ink-dim">
                <Highlight text={band.description} query={query} />
              </p>
            </div>
          );
        })}
      </div>

      {/* Proof callout */}
      <div className="mt-6 flex gap-3 rounded-r-[10px] border-l-2 border-patina bg-bg-raised p-5">
        <Info className="mt-0.5 size-4 shrink-0 text-patina" aria-hidden />
        <p className="font-serif text-[15px] italic leading-[1.65] text-ink-dim">
          Proof (PF/PR) describes a method of manufacture, not condition. A proof can be impaired —
          and a circulation strike can be flawless.
        </p>
      </div>
    </div>
  );
}
