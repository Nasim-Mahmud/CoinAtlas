import { AnimatePresence, motion } from "framer-motion";
import { Check, Download, Tag, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Batch selection bar (collection.md) — slides up when ≥1 card is selected.
 * Fixed bottom pill above the mobile tab bar.
 */

export interface BatchBarProps {
  count: number;
  onVerify: () => void;
  onAddTag: () => void;
  onExport: () => void;
  onDelete: () => void;
  onClear: () => void;
}

function BarButton({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Check;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[12px] uppercase tracking-[0.1em] transition-colors",
        danger ? "text-oxblood hover:bg-oxblood/10" : "text-ink-dim hover:bg-bg-inset hover:text-ink",
      )}
    >
      <Icon className="size-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function BatchBar({ count, onVerify, onAddTag, onExport, onDelete, onClear }: BatchBarProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 lg:bottom-6"
        >
          <div className="flex items-center gap-1 rounded-full border border-line-strong bg-bg-raised px-4 py-2.5 shadow-xl sm:px-6 sm:py-3">
            <span className="tabular mr-1 font-mono text-[12px] uppercase tracking-[0.12em] text-brass">
              {count} selected
            </span>
            <BarButton icon={Check} label="Verify" onClick={onVerify} />
            <BarButton icon={Tag} label="Add tag…" onClick={onAddTag} />
            <BarButton icon={Download} label="Export JSON" onClick={onExport} />
            <BarButton icon={Trash2} label="Delete" onClick={onDelete} danger />
            <span aria-hidden className="mx-1 h-5 w-px bg-line" />
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear selection"
              className="grid size-7 place-items-center rounded-full text-ink-faint transition-colors hover:bg-bg-inset hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
