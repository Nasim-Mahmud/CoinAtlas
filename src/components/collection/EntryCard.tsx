import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import type { Coin } from "@/types/coin";
import { coinTitle, formatAccession } from "@/lib/coin-utils";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ReedRing, SvgMask } from "@/components/coin/CoinImage";
import StatusDot from "@/components/coin/StatusDot";
import GradeBadge from "@/components/coin/GradeBadge";
import ConfidenceBar from "@/components/coin/ConfidenceBar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * EntryCard (grid) + EntryRow (list) — the catalogue's core artifact
 * (collection.md "Results"). Cards flip obverse→reverse on hover (tap on
 * touch: first tap flips, second tap navigates), show the reed ring on
 * hover, and support batch-selection mode.
 */

/** Router state handed to the detail page for prev/next navigation. */
export interface CoinNavState {
  listIds?: string[];
}

function firstRef(c: Coin): string | undefined {
  const r = c.catalogRefs[0];
  if (!r) return undefined;
  const hash = /^[A-Za-z]+$/.test(r.system) && r.system.toUpperCase() !== "RIC" ? "#" : "";
  return `${r.system}${hash} ${r.code}`;
}

function compFamily(c: Coin): string | undefined {
  return c.composition?.split(/[ :/.,(]/)[0]?.trim() || undefined;
}

/* ------------------------- flippable card coin ------------------------- */

function CardCoin({ coin, size = "card" }: { coin: Coin; size?: "card" | "row" }) {
  const [flipped, setFlipped] = useState(false);
  const [obvFailed, setObvFailed] = useState(false);
  const [revFailed, setRevFailed] = useState(false);
  const obv = obvFailed ? undefined : coin.images.obverse;
  const rev = revFailed ? undefined : coin.images.reverse;
  const canFlip = Boolean(rev);

  const face = (src: string | undefined, back: boolean, label: string) =>
    src ? (
      <div className={cn("coin-face overflow-hidden rounded-full", back && "coin-face-back")}>
        <img
          src={src}
          alt={`${coin.title} — ${label}`}
          loading="lazy"
          draggable={false}
          onError={() => (back ? setRevFailed(true) : setObvFailed(true))}
          className="size-full select-none rounded-full object-cover"
        />
      </div>
    ) : (
      <div
        className={cn(
          "coin-face flex items-center justify-center rounded-full bg-inset text-ink-faint",
          back && "coin-face-back",
        )}
      >
        <SvgMask src="/empty-coin.svg" className="size-1/2 opacity-60" />
      </div>
    );

  return (
    <div
      className={cn(
        "coin-flip-scene group/coin relative",
        size === "card" ? "aspect-square w-full max-w-[170px]" : "size-full",
      )}
      onMouseEnter={() => canFlip && setFlipped(true)}
      onMouseLeave={() => canFlip && setFlipped(false)}
    >
      <div className={cn("coin-flip-inner", canFlip && flipped && "is-flipped")}>
        {face(obv, false, "obverse")}
        {face(rev, true, "reverse")}
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full border-2 border-line-strong/60"
      />
      <ReedRing
        className={cn(
          "opacity-0 transition-opacity duration-300",
          "group-hover/coin:opacity-70",
          canFlip && flipped && "opacity-70",
        )}
      />
      {/* touch: first tap flips (stopPropagation keeps the card from navigating) */}
      {canFlip && (
        <button
          type="button"
          aria-pressed={flipped}
          aria-label={`Flip ${coin.title}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setFlipped((f) => !f);
          }}
          className="absolute inset-0 rounded-full [@media(hover:hover)]:hidden"
        />
      )}
    </div>
  );
}

/* ------------------------------ grid card ------------------------------ */

export interface EntryCardProps {
  coin: Coin;
  selected: boolean;
  selectionActive: boolean;
  onToggleSelect: (id: string) => void;
  navState: CoinNavState;
}

export function EntryCard({ coin, selected, selectionActive, onToggleSelect, navState }: EntryCardProps) {
  const pending = coin.status === "pending";
  const meta = [firstRef(coin), compFamily(coin)].filter(Boolean).join(" · ");

  return (
    <motion.div
      layout="position"
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
    >
      <Link
        to={`/coin/${coin.id}`}
        state={navState}
        className={cn(
          "card-hover group relative block rounded-[12px] border bg-bg-raised p-5",
          selected
            ? "border-brass bg-brass/5"
            : pending
              ? "border-copper/40"
              : "border-line",
        )}
      >
        {/* selection checkbox — appears on hover, always on touch / selection mode */}
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={`Select ${coin.title}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSelect(coin.id);
          }}
          className={cn(
            "absolute left-2.5 top-2.5 z-10 grid size-6 place-items-center rounded-full border bg-bg-raised/90 transition-opacity",
            selected
              ? "border-brass bg-brass text-[#131009] opacity-100"
              : "border-line-strong text-transparent opacity-0 hover:border-brass group-hover:opacity-100 [@media(hover:none)]:opacity-100",
            selectionActive && "opacity-100",
          )}
        >
          <Check className="size-3.5" strokeWidth={3} />
        </button>

        {/* grade chip top-left (offset when checkbox space is needed) */}
        {coin.grade && (
          <GradeBadge grade={coin.grade} className="absolute left-9 top-3 z-10 bg-bg-raised/90" />
        )}

        {/* status dot top-right */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="absolute right-3.5 top-3.5 z-10">
                <StatusDot status={coin.status} />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {coin.status === "verified" ? "Verified" : coin.status === "pending" ? "Pending review" : "Draft"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* coin image with spotlight */}
        <div className="relative mx-auto w-fit">
          <div aria-hidden className="spot-glow absolute -inset-6 rounded-full" />
          <CardCoin coin={coin} />
        </div>

        {/* body */}
        <div className="mt-4">
          <div className="font-mono text-[11px] tracking-[0.08em] text-ink-faint">
            {formatAccession(coin.accessionNo)}
          </div>
          <h3 className="mt-1 line-clamp-2 font-display text-[18px] font-medium leading-snug text-ink">
            {coinTitle(coin)}
          </h3>
          {meta && <div className="mt-0.5 line-clamp-1 font-mono text-[12px] text-ink-dim">{meta}</div>}
          {pending && (
            <div className="mt-2 space-y-1.5">
              <span className="inline-flex items-center rounded-full border border-copper/40 bg-copper/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-copper">
                Needs review
              </span>
              {coin.confidence != null && <ConfidenceBar value={coin.confidence} showValue className="w-full" />}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/* ------------------------------- list row ------------------------------ */

export function EntryRow({ coin, selected, selectionActive, onToggleSelect, navState }: EntryCardProps) {
  return (
    <motion.div layout="position" exit={{ opacity: 0, transition: { duration: 0.2 } }}>
      <Link
        to={`/coin/${coin.id}`}
        state={navState}
        className={cn(
          "group grid grid-cols-[64px_1fr_auto] items-center gap-4 border-b border-line/50 px-2 py-3 transition-colors hover:bg-bg-raised",
          "md:grid-cols-[72px_2fr_1fr_1fr_1fr_auto]",
          selected && "bg-brass/5",
        )}
      >
        <div className="relative size-16 md:size-[72px]">
          <CardCoin coin={coin} size="row" />
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Select ${coin.title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSelect(coin.id);
            }}
            className={cn(
              "absolute -left-1 -top-1 z-10 grid size-5 place-items-center rounded-full border bg-bg-raised transition-opacity",
              selected
                ? "border-brass bg-brass text-[#131009] opacity-100"
                : "border-line-strong text-transparent opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
              selectionActive && "opacity-100",
            )}
          >
            <Check className="size-3" strokeWidth={3} />
          </button>
        </div>

        <div className="min-w-0">
          <div className="truncate font-display text-[17px] font-medium text-ink">{coin.title}</div>
          <div className="mt-0.5 truncate font-mono text-[12px] text-ink-faint">
            {formatAccession(coin.accessionNo)}
            {firstRef(coin) ? ` · ${firstRef(coin)}` : ""}
          </div>
        </div>

        <div className="hidden truncate font-mono text-[13px] text-ink-dim md:block">{coin.country}</div>
        <div className="hidden font-mono text-[13px] text-ink-dim md:block">
          {coin.year ?? coin.era ?? "—"}
        </div>
        <div className="hidden md:block">{coin.grade && <GradeBadge grade={coin.grade} />}</div>

        <div className="flex items-center gap-3">
          {coin.estimatedValue != null && (
            <span className="tabular hidden font-mono text-[13px] text-brass sm:block">
              {formatMoney(coin.estimatedValue, coin.currency ?? "USD")}
            </span>
          )}
          <StatusDot status={coin.status} />
          <ChevronRight className="size-4 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brass" />
        </div>
      </Link>
    </motion.div>
  );
}
