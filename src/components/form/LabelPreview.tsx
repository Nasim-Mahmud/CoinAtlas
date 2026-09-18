import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { CoinFormValues } from "@/components/form/form-utils";
import { COMPLETENESS_FIELDS, countFilled } from "@/components/form/form-utils";
import GradeBadge from "@/components/coin/GradeBadge";
import StatusDot from "@/components/coin/StatusDot";
import { SvgMask } from "@/components/coin/CoinImage";

/**
 * Live label preview rail (add-edit.md): a mini museum plaque that builds
 * itself as you type, plus the catalogue-completeness meter.
 */

function useDebounced<T>(value: T, ms = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function LabelPreview({ values, nextAccession }: { values: CoinFormValues; nextAccession?: string }) {
  const v = useDebounced(values, 200);
  const filled = countFilled(v, COMPLETENESS_FIELDS);
  const total = COMPLETENESS_FIELDS.length;
  const pct = Math.round((filled / total) * 100);

  const when = v.yearText.trim();
  const titleMain = [v.denomination.trim(), when].filter(Boolean).join(" · ");
  const image = v.images.obverse ?? v.images.reverse;

  const quickFacts: [string, string | undefined][] = [
    ["Composition", v.composition.trim() || undefined],
    ["Weight", v.weightG.trim() ? `${v.weightG.trim()} g` : undefined],
    ["Diameter", v.diameterMm.trim() ? `${v.diameterMm.trim()} mm` : undefined],
    ["Mint", v.mint.trim() || undefined],
  ];
  const facts = quickFacts.filter((f): f is [string, string] => Boolean(f[1]));

  const prevFilled = useRef(filled);
  const [pop, setPop] = useState(0);
  useEffect(() => {
    if (filled !== prevFilled.current) {
      prevFilled.current = filled;
      setPop((p) => p + 1);
    }
  }, [filled]);

  return (
    <div>
      <p className="overline-label">Live label</p>
      <div className="mt-3 rounded-[12px] border border-line bg-bg-raised p-5">
        <div className="flex items-start gap-4">
          <div className="relative size-20 shrink-0">
            {image ? (
              <motion.img
                key={image.slice(0, 64)}
                src={image}
                alt="Coin preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="size-full rounded-full border border-line object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center rounded-full border border-dashed border-line-strong bg-bg-inset/50">
                <SvgMask src="/empty-coin.svg" className="size-10 text-ink-faint" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            {nextAccession && (
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{nextAccession}</p>
            )}
            <p className="mt-0.5 truncate font-display text-[17px] font-medium leading-snug text-ink">
              {titleMain || "Untitled entry"}
            </p>
            <p className="truncate font-serif text-[13.5px] italic text-ink-dim">
              {v.country.trim() || "Country —"}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <StatusDot status={v.status} label />
              {v.grade.trim() && <GradeBadge grade={v.grade.trim()} />}
            </div>
          </div>
        </div>
        {facts.length > 0 && (
          <dl className="mt-4 border-t border-line/60 pt-3">
            {facts.map(([k, val]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 py-0.5">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">{k}</dt>
                <dd className="truncate font-mono text-[12px] text-ink">{val}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <p className="overline-label">Catalogue completeness</p>
          <motion.p
            key={pop}
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className="font-mono text-[11px] text-ink-dim"
          >
            {filled} / {total} fields
          </motion.p>
        </div>
        <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-bronze to-brass"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
