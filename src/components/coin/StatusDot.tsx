import { cn } from "@/lib/utils";
import type { CoinStatus } from "@/types/coin";

/**
 * Status semantics (design.md §2):
 * patina = verified · copper = pending · ink-faint hollow = draft.
 * Never conveyed by color alone — pair with `label` (or aria-label).
 */

const STATUS_META: Record<CoinStatus, { text: string; dot: string; ring?: boolean }> = {
  verified: { text: "Verified", dot: "bg-patina" },
  pending: { text: "Pending review", dot: "bg-copper" },
  draft: { text: "Draft", dot: "border border-ink-faint bg-transparent", ring: true },
};

export interface StatusDotProps {
  status: CoinStatus;
  /** Render the text label next to the dot. */
  label?: boolean;
  className?: string;
}

export default function StatusDot({ status, label = false, className }: StatusDotProps) {
  const meta = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} role="status">
      <span
        aria-hidden
        className={cn("inline-block size-2 shrink-0 rounded-full", meta.dot)}
      />
      {label ? (
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-dim">{meta.text}</span>
      ) : (
        <span className="sr-only">{meta.text}</span>
      )}
    </span>
  );
}
