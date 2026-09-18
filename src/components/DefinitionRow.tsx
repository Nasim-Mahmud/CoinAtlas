import { useState } from "react";
import type { ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Spec-plaque definition rows (design.md §6.4): grid 160px 1fr (stacked on
 * mobile), mono overline label, mono value, hairline separators, copy-on-click
 * with a toast.
 */

export interface DefinitionRowProps {
  label: string;
  value?: ReactNode;
  /** Raw string copied to the clipboard on click (defaults to `value` when it's a string/number). */
  copyValue?: string;
  className?: string;
}

export function DefinitionRow({ label, value, copyValue, className }: DefinitionRowProps) {
  const [copied, setCopied] = useState(false);
  const text =
    copyValue ?? (typeof value === "string" || typeof value === "number" ? String(value) : undefined);
  const empty = value == null || value === "" || value === "—";

  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied", { description: text });
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div
      className={cn(
        "group grid grid-cols-1 gap-0.5 border-b border-line/50 py-3 sm:grid-cols-[160px_1fr] sm:items-baseline sm:gap-4",
        className,
      )}
    >
      <dt className="overline-label">{label}</dt>
      <dd className="flex items-center gap-2 font-mono text-[14px] text-ink">
        <span className={cn(empty && "text-ink-faint")}>{empty ? "—" : value}</span>
        {text && !empty && (
          <button
            type="button"
            onClick={copy}
            aria-label={`Copy ${label}`}
            className="text-ink-faint opacity-0 transition-opacity hover:text-brass focus-visible:opacity-100 group-hover:opacity-100"
          >
            {copied ? <Check className="size-3.5 text-patina" /> : <Copy className="size-3.5" />}
          </button>
        )}
      </dd>
    </div>
  );
}

export function DefinitionList({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn("w-full", className)}>{children}</dl>;
}

export default DefinitionRow;
