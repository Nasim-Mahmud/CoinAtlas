import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SvgMask } from "@/components/coin/CoinImage";

/**
 * Empty state (design.md §6.4): centered empty-coin art, Fraunces headline,
 * serif body, CTA button(s).
 */
export interface EmptyStateProps {
  headline: string;
  body?: string;
  /** Primary CTA. */
  cta?: { label: string; to: string };
  /** Secondary CTA. */
  secondaryCta?: { label: string; to: string };
  /** Fully custom action area (overrides cta/secondaryCta). */
  actions?: ReactNode;
  className?: string;
}

export default function EmptyState({ headline, body, cta, secondaryCta, actions, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-16 text-center", className)}>
      <SvgMask src="/empty-coin.svg" className="size-32 text-ink-faint opacity-80" />
      <h2 className="mt-6 font-display text-[22px] font-medium text-ink">{headline}</h2>
      {body && <p className="mt-2 max-w-[46ch] font-serif text-[15.5px] leading-[1.65] text-ink-dim">{body}</p>}
      {actions ? (
        <div className="mt-6">{actions}</div>
      ) : (
        (cta || secondaryCta) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {cta && (
              <Link
                to={cta.to}
                className="rounded-md bg-brass px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#131009] transition-colors hover:bg-brass-bright"
              >
                {cta.label}
              </Link>
            )}
            {secondaryCta && (
              <Link
                to={secondaryCta.to}
                className="rounded-md border border-line bg-bg-raised px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        )
      )}
    </div>
  );
}
