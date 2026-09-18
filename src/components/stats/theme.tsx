import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared stats-page theme: data-viz palette (design.md §2 cycle order),
 * themed recharts tooltip, and the museum-label chart card wrapper.
 */

export const VIZ = ["#C9A24B", "#5F8F7E", "#8A6A3B", "#B0663A", "#A4443C", "#EDE4D2"] as const;
export const BRASS = "#C9A24B";
export const BRASS_BRIGHT = "#E5C57A";
export const PATINA = "#5F8F7E";
export const BRONZE = "#8A6A3B";
export const COPPER = "#B0663A";
export const OXBLOOD = "#A4443C";
export const INK_FAINT = "#7C6F57";
export const LINE = "#2E261A";
export const MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, monospace';

export function viz(i: number): string {
  return VIZ[i % VIZ.length];
}

/** Tick style shared by recharts axes (mono, ink-faint). */
export const AXIS_TICK = { fill: INK_FAINT, fontSize: 10, fontFamily: MONO } as const;

interface TooltipPayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
  payload?: Record<string, unknown>;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
  /** Render one payload entry as display text. */
  renderEntry?: (entry: TooltipPayloadEntry, index: number) => string;
}

/** Themed tooltip (stats.md): bg-inset well, mono 12px. */
export function ChartTooltip({ active, payload, label, renderEntry }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-line bg-bg-inset px-3 py-2 font-mono text-[12px] text-ink shadow-lg">
      {label != null && label !== "" && (
        <div className="overline-label mb-1.5">{String(label)}</div>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block size-2 shrink-0 rounded-full"
              style={{ background: entry.fill ?? entry.color ?? VIZ[0] }}
            />
            <span className="tabular">
              {renderEntry ? renderEntry(entry, i) : `${entry.name ?? ""} ${entry.value ?? ""}`.trim()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface StatCardProps {
  overline: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Chart card (stats.md): bg-raised panel, overline + Fraunces H3 header. */
export function StatCard({ overline, title, action, children, className }: StatCardProps) {
  return (
    <section className={cn("rounded-[12px] border border-line bg-bg-raised p-6", className)}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-px w-6 bg-brass" />
            <span className="overline-label">{overline}</span>
          </div>
          <h3 className="mt-2 font-display text-[20px] font-medium tracking-[-0.01em] text-ink">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
