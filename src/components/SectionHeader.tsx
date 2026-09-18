import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The museum-label signature (design.md §3): overline + hairline rule with a
 * 24px brass segment, above a Fraunces heading.
 */
export interface SectionHeaderProps {
  overline: string;
  title: ReactNode;
  /** Optional right-side content (link, count…). */
  action?: ReactNode;
  /** Heading level styling: "page" = H1 std 44px, "section" = H2 30px (default). */
  size?: "page" | "section";
  className?: string;
}

export default function SectionHeader({ overline, title, action, size = "section", className }: SectionHeaderProps) {
  const Heading = size === "page" ? "h1" : "h2";
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <div>
        <div className="flex items-center gap-3">
          <span aria-hidden className="h-px w-6 bg-brass" />
          <span aria-hidden className="h-px flex-1 bg-line" />
          <span className="overline-label -ml-3 pl-3">{overline}</span>
        </div>
        <Heading
          className={cn(
            "mt-3 font-display font-semibold tracking-[-0.015em] text-ink",
            size === "page" ? "text-[32px] leading-[1.05] md:text-[44px]" : "text-[24px] leading-tight md:text-[30px]",
          )}
        >
          {title}
        </Heading>
      </div>
      {action && <div className="pb-1">{action}</div>}
    </div>
  );
}
