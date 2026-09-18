import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stat tile (design.md §6.4): overline label + Fraunces numeral + mono caption.
 * Numerals count up 0.9s easeOut when scrolled into view (final value
 * immediately under prefers-reduced-motion).
 */
export interface StatTileProps {
  label: string;
  value: number;
  /** Format the numeral (default: grouped integer). */
  format?: (n: number) => string;
  caption?: string;
  icon?: LucideIcon;
  /** Accent color for the numeral (e.g. "copper" for pending counts). */
  accent?: "default" | "copper" | "patina" | "brass";
  onClick?: () => void;
  className?: string;
}

const ACCENT_CLASS: Record<NonNullable<StatTileProps["accent"]>, string> = {
  default: "text-ink",
  copper: "text-copper",
  patina: "text-patina",
  brass: "text-brass",
};

export default function StatTile({
  label,
  value,
  format,
  caption,
  icon: Icon,
  accent = "default",
  onClick,
  className,
}: StatTileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value]);

  const formatted = format ? format(display) : String(Math.round(display));

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="overline-label">{label}</span>
        {Icon && <Icon className="size-4 text-ink-faint" aria-hidden />}
      </div>
      <div
        className={cn(
          "tabular mt-2 font-display text-[34px] font-semibold leading-none tracking-[-0.01em]",
          ACCENT_CLASS[accent],
        )}
      >
        {formatted}
      </div>
      {caption && <div className="mt-2 font-mono text-[12px] text-ink-dim">{caption}</div>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        ref={ref as never}
        onClick={onClick}
        className={cn("w-full p-5 text-left transition-colors hover:bg-bg-inset/60", className)}
      >
        {body}
      </button>
    );
  }
  return (
    <div ref={ref} className={cn("p-5", className)}>
      {body}
    </div>
  );
}
