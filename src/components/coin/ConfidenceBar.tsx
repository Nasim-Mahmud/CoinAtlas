import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Identification confidence bar (design.md §6.4): h-[6px] rounded-full on a
 * bg-line track; fill gradient bronze→brass, solid patina when ≥ 80%;
 * width animates 0.8s easeOut on mount.
 */
export interface ConfidenceBarProps {
  /** 0–100 */
  value: number;
  /** Show the numeric percentage on the right. */
  showValue?: boolean;
  className?: string;
}

export default function ConfidenceBar({ value, showValue = false, className }: ConfidenceBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setWidth(clamped);
      return;
    }
    const raf = requestAnimationFrame(() => setWidth(clamped));
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  const high = clamped >= 80;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Identification confidence ${clamped}%`}
        className="h-[6px] w-full min-w-[64px] overflow-hidden rounded-full bg-line"
      >
        <span
          className={cn(
            "block h-full rounded-full transition-[width] ease-out [transition-duration:800ms]",
            high ? "bg-patina" : "bg-gradient-to-r from-bronze to-brass",
          )}
          style={{ width: `${width}%` }}
        />
      </span>
      {showValue && <span className="tabular font-mono text-[12px] text-ink-dim">{clamped}%</span>}
    </span>
  );
}
