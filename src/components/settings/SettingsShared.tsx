import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Section shell (settings.md): overline `0X · NAME` + Fraunces H2 + content. */
export function SettingsSection({
  id,
  index,
  title,
  children,
  danger,
}: {
  id: string;
  index: number;
  title: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3">
        <span aria-hidden className={cn("h-px w-6", danger ? "bg-oxblood" : "bg-brass")} />
        <span className={cn("overline-label", danger && "text-oxblood")}>
          {String(index).padStart(2, "0")} · {title.toUpperCase()}
        </span>
      </div>
      <h2 className="mt-2 font-display text-[24px] font-semibold text-ink">{title}</h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function SettingsCard({
  children,
  danger,
  className,
}: {
  children: ReactNode;
  danger?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[12px] border bg-bg-raised p-6",
        danger ? "border-oxblood/50" : "border-line",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel = "Confirm",
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-line bg-bg-raised">
        <DialogHeader>
          <DialogTitle className="font-display text-ink">{title}</DialogTitle>
          <DialogDescription className="font-serif text-[15px] leading-[1.6] text-ink-dim">
            {body}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-line font-mono text-[12px] uppercase tracking-[0.1em]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            className={
              destructive
                ? "font-mono text-[12px] uppercase tracking-[0.1em]"
                : "bg-brass font-mono text-[12px] uppercase tracking-[0.1em] text-[#131009] hover:bg-brass-bright"
            }
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Type-to-confirm gate (settings.md §06 danger zone). */
export function TypedConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  word,
  confirmLabel,
  extra,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: ReactNode;
  word: string;
  confirmLabel: string;
  extra?: ReactNode;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toUpperCase() === word.toUpperCase();

  const close = (o: boolean) => {
    if (!o) setTyped("");
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="border-oxblood/50 bg-bg-raised">
        <DialogHeader>
          <DialogTitle className="font-display text-ink">{title}</DialogTitle>
          <DialogDescription className="font-serif text-[15px] leading-[1.6] text-ink-dim">
            {body}
          </DialogDescription>
        </DialogHeader>
        <div>
          <label htmlFor="typed-confirm" className="overline-label mb-1.5 block">
            Type {word} to confirm
          </label>
          <Input
            id="typed-confirm"
            value={typed}
            autoComplete="off"
            onChange={(e) => setTyped(e.target.value)}
            placeholder={word}
            className={cn(
              "bg-bg-inset font-mono text-[14px] uppercase tracking-[0.12em] transition-colors",
              typed !== "" && (matches ? "border-patina" : "border-oxblood"),
            )}
          />
        </div>
        {extra}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-line font-mono text-[12px] uppercase tracking-[0.1em]"
            onClick={() => close(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!matches}
            className="font-mono text-[12px] uppercase tracking-[0.1em] transition-opacity"
            onClick={() => {
              close(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
