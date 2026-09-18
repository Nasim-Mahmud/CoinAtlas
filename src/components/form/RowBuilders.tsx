import { AnimatePresence, motion } from "framer-motion";
import { Globe, Plus, X } from "lucide-react";
import type { CatalogRef, CoinSource } from "@/types/coin";
import { Input } from "@/components/ui/input";
import { ComboboxField, Chip, FieldError } from "@/components/form/fields";
import { REF_SYSTEM_SUGGESTIONS } from "@/components/form/form-utils";

/**
 * Repeatable row builders (add-edit.md §04): catalogue references
 * (system + code) and sources (label + URL), rows animating in/out.
 */

const rowMotion = {
  initial: { opacity: 0, height: 0, marginBottom: 0 },
  animate: { opacity: 1, height: "auto", marginBottom: 8 },
  exit: { opacity: 0, height: 0, marginBottom: 0 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

export interface CatalogRefEditorProps {
  refs: CatalogRef[];
  onChange: (refs: CatalogRef[]) => void;
}

export function CatalogRefEditor({ refs, onChange }: CatalogRefEditorProps) {
  const update = (i: number, patch: Partial<CatalogRef>) =>
    onChange(refs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div>
      <AnimatePresence initial={false}>
        {refs.map((r, i) => (
          <motion.div key={i} {...rowMotion} className="overflow-hidden">
            <div className="flex items-center gap-2">
              <div className="w-32 shrink-0">
                <ComboboxField
                  value={r.system}
                  onChange={(v) => update(i, { system: v })}
                  suggestions={REF_SYSTEM_SUGGESTIONS}
                  placeholder="System"
                />
              </div>
              <Input
                value={r.code}
                onChange={(e) => update(i, { code: e.target.value })}
                placeholder="1289"
                aria-label="Catalogue code"
                className="bg-bg-inset font-mono text-[14px]"
              />
              <button
                type="button"
                aria-label="Remove reference"
                onClick={() => onChange(refs.filter((_, j) => j !== i))}
                className="shrink-0 rounded-md p-2 text-ink-faint transition-colors hover:text-oxblood"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {refs.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {refs
            .filter((r) => r.system || r.code)
            .map((r, i) => (
              <Chip key={`${r.system}-${r.code}-${i}`}>{`${r.system || "?"} ${r.code}`}</Chip>
            ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange([...refs, { system: "", code: "" }])}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line-strong px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-dim transition-colors hover:border-brass/60 hover:text-brass"
      >
        <Plus className="size-3.5" aria-hidden />
        Add reference
      </button>
    </div>
  );
}

export interface SourcesEditorProps {
  sources: CoinSource[];
  onChange: (sources: CoinSource[]) => void;
  errors?: { label?: string; url?: string }[];
}

export function SourcesEditor({ sources, onChange, errors }: SourcesEditorProps) {
  const update = (i: number, patch: Partial<CoinSource>) =>
    onChange(sources.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <div>
      <AnimatePresence initial={false}>
        {sources.map((s, i) => (
          <motion.div key={i} {...rowMotion} className="overflow-hidden">
            <div className="flex items-start gap-2">
              <Input
                value={s.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Label — Numista, PCGS…"
                aria-label="Source label"
                className="bg-bg-inset font-mono text-[13px]"
              />
              <div className="relative flex-1">
                <Globe
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint"
                />
                <Input
                  value={s.url}
                  onChange={(e) => update(i, { url: e.target.value })}
                  placeholder="https://…"
                  aria-label="Source URL"
                  aria-invalid={Boolean(errors?.[i]?.url) || undefined}
                  className="bg-bg-inset pl-9 font-mono text-[13px]"
                />
              </div>
              <button
                type="button"
                aria-label="Remove source"
                onClick={() => onChange(sources.filter((_, j) => j !== i))}
                className="shrink-0 rounded-md p-2 text-ink-faint transition-colors hover:text-oxblood"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <FieldError message={errors?.[i]?.url} />
          </motion.div>
        ))}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => onChange([...sources, { label: "", url: "" }])}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line-strong px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-dim transition-colors hover:border-brass/60 hover:text-brass"
      >
        <Plus className="size-3.5" aria-hidden />
        Add source
      </button>
    </div>
  );
}
