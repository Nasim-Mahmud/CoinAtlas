import { cn } from "@/lib/utils";
import type { CatalogRef } from "@/types/coin";

/**
 * Catalogue reference chips — "KM# 1289", "Y# 178", "RIC II.3 137".
 * Mono, bronze-tinted per the badge spec (design.md §6.4).
 */
export interface CatalogRefChipsProps {
  refs: CatalogRef[];
  /** Cap how many chips render; the rest collapse into "+n". */
  max?: number;
  className?: string;
}

/** "KM" → "KM#"; systems already containing punctuation pass through. */
function refLabel(r: CatalogRef): string {
  const needsHash = /^[A-Za-z]+$/.test(r.system) && r.system.toUpperCase() !== "RIC";
  return `${r.system}${needsHash ? "#" : ""} ${r.code}`;
}

export default function CatalogRefChips({ refs, max, className }: CatalogRefChipsProps) {
  if (!refs || refs.length === 0) return null;
  const shown = max != null ? refs.slice(0, max) : refs;
  const overflow = max != null ? refs.length - shown.length : 0;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {shown.map((r, i) => (
        <span
          key={`${r.system}-${r.code}-${i}`}
          className={cn(
            "inline-flex items-center rounded-full border border-bronze/40 bg-bronze/10 px-2 py-0.5",
            "font-mono text-[11px] font-medium tracking-[0.08em] text-bronze",
          )}
        >
          {refLabel(r)}
        </span>
      ))}
      {overflow > 0 && (
        <span className="font-mono text-[11px] tracking-[0.08em] text-ink-faint">+{overflow}</span>
      )}
    </span>
  );
}
