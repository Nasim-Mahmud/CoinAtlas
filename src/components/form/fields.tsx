import { useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";

/**
 * Small field primitives for the catalogue form (add-edit.md):
 * FieldLabel (mono overline), UnitInput (unit suffix), ComboboxField
 * (creatable suggestion popover), ChipSelect (radio-chip row + free text).
 */

export function FieldLabel({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <Label htmlFor={htmlFor} className="overline-label cursor-pointer">
        {children}
      </Label>
      {hint && <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">{hint}</span>}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-oxblood">{message}</p>;
}

/** Number-style input with a unit suffix inside the field (add-edit.md §02). */
export function UnitInput({
  id,
  unit,
  invalid,
  ...props
}: React.ComponentProps<"input"> & { unit?: string; invalid?: boolean }) {
  return (
    <div className="relative">
      <Input
        id={id}
        inputMode="decimal"
        aria-invalid={invalid || undefined}
        className={cn("bg-bg-inset font-mono text-[14px]", unit && "pr-10", invalid && "border-oxblood")}
        {...props}
      />
      {unit && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[12px] text-ink-faint">
          {unit}
        </span>
      )}
    </div>
  );
}

export interface ComboboxFieldProps {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  /** Serif styling for prose-ish fields. */
  serif?: boolean;
  uppercase?: boolean;
  className?: string;
  mono?: boolean;
}

/**
 * Creatable combobox (add-edit.md: "all selects/comboboxes are creatable").
 * Text input with a fuzzy-filtered suggestion popover; any typed value is kept.
 */
export function ComboboxField({
  id,
  value,
  onChange,
  suggestions,
  placeholder,
  serif,
  uppercase,
  className,
  mono = true,
}: ComboboxFieldProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    const pool = q
      ? suggestions.filter((s) => s.toLowerCase().includes(q))
      : suggestions;
    return pool.slice(0, 12);
  }, [value, suggestions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            id={id}
            value={value}
            autoComplete="off"
            placeholder={placeholder}
            onChange={(e) => {
              onChange(uppercase ? e.target.value.toUpperCase() : e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter" && open && filtered.length > 0) {
                e.preventDefault();
                onChange(uppercase ? filtered[0].toUpperCase() : filtered[0]);
                setOpen(false);
              }
            }}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            className={cn(
              "bg-bg-inset text-[14px]",
              mono && "font-mono",
              serif && "font-serif text-[15px]",
              uppercase && "uppercase",
              className,
            )}
          />
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] border-line bg-bg-raised p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {filtered.length === 0 ? (
          <p className="px-2 py-2 font-mono text-[12px] text-ink-faint">
            No matches — your value is kept as entered.
          </p>
        ) : (
          <ul className="max-h-56 overflow-y-auto">
            {filtered.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(uppercase ? s.toUpperCase() : s);
                    setOpen(false);
                    inputRef.current?.focus();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left font-mono text-[13px] text-ink",
                    "hover:bg-bg-inset focus-visible:bg-bg-inset",
                    s === value && "text-brass",
                  )}
                >
                  <span className="truncate">{s}</span>
                  {s === value && <Check className="size-3.5 shrink-0" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

export interface ChipSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  "aria-label": string;
}

/**
 * Radio-chip row (add-edit.md §02): preset chips plus a free-text fallback
 * ("Other" reveals an input; any custom value is preserved).
 */
export function ChipSelect({ value, onChange, options, "aria-label": ariaLabel }: ChipSelectProps) {
  const inputId = useId();
  const preset = options.filter((o) => o !== "Other");
  const isPreset = preset.some((o) => o.toLowerCase() === value.toLowerCase());
  const isOther = value !== "" && !isPreset;

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap items-center gap-2">
      {preset.map((o) => {
        const active = value.toLowerCase() === o.toLowerCase();
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? "" : o)}
            className={cn(
              "rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors",
              active
                ? "border-brass/60 bg-brass/10 text-brass"
                : "border-line bg-bg-raised text-ink-dim hover:border-line-strong hover:text-ink",
            )}
          >
            {o}
          </button>
        );
      })}
      <div className="relative">
        <Input
          id={inputId}
          value={isOther ? value : ""}
          placeholder="Other…"
          aria-label={`${ariaLabel} — custom value`}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-8 w-32 rounded-full bg-bg-inset font-mono text-[12px]",
            isOther && "border-brass/60 text-brass",
          )}
        />
        {isOther && (
          <button
            type="button"
            aria-label="Clear custom value"
            onClick={() => onChange("")}
            className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full border border-line bg-bg-raised text-ink-faint hover:text-oxblood"
          >
            <X className="size-2.5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ chip editors ---------------------------- */

export function Chip({ children, onRemove, title }: { children: ReactNode; onRemove?: () => void; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1.5 rounded-full border border-bronze/40 bg-bronze/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink"
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="text-ink-faint transition-colors hover:text-oxblood"
        >
          <X className="size-3" aria-hidden />
        </button>
      )}
    </span>
  );
}

export interface TagEditorProps {
  id?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}

/** Tag chip input: Enter adds, × removes, autocomplete from existing tags. */
export function TagEditor({ id, tags, onChange, suggestions }: TagEditorProps) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = draft.trim().toLowerCase();
    return suggestions
      .filter((s) => !tags.includes(s) && (q === "" || s.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [draft, suggestions, tags]);

  const add = (raw: string) => {
    const t = raw.trim().toLowerCase();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setDraft("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((t) => (
          <Chip key={t} onRemove={() => onChange(tags.filter((x) => x !== t))}>
            {t}
          </Chip>
        ))}
      </div>
      <Popover open={open && filtered.length > 0} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative mt-2">
            <Input
              id={id}
              value={draft}
              autoComplete="off"
              placeholder="Add tag — Enter to confirm"
              onChange={(e) => {
                setDraft(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => window.setTimeout(() => setOpen(false), 120)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add(filtered[0] && draft.trim() === "" ? filtered[0] : draft);
                }
                if (e.key === "Backspace" && draft === "" && tags.length > 0) {
                  onChange(tags.slice(0, -1));
                }
                if (e.key === "Escape") setOpen(false);
              }}
              className="bg-bg-inset pr-9 font-mono text-[13px]"
            />
            <button
              type="button"
              aria-label="Add tag"
              onClick={() => add(draft)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-ink-faint transition-colors hover:text-brass"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] border-line bg-bg-raised p-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ul>
            {filtered.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(s);
                  }}
                  className="w-full rounded-sm px-2 py-1.5 text-left font-mono text-[13px] text-ink hover:bg-bg-inset"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
