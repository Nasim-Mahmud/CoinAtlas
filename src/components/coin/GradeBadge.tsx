import { cn } from "@/lib/utils";

/**
 * Grade chip (design.md §6.4 badges): rounded-full, mono 11px uppercase,
 * brass-tinted 1px border at 40%, text full color, bg at 10%.
 */
export interface GradeBadgeProps {
  grade?: string;
  className?: string;
}

export default function GradeBadge({ grade, className }: GradeBadgeProps) {
  if (!grade) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-brass/40 bg-brass/10 px-2 py-0.5",
        "font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-brass",
        className,
      )}
    >
      {grade}
    </span>
  );
}
