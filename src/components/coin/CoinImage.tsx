import { useState } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/asset";

/**
 * CoinImage — the signature component (design.md §5).
 * Circular coin photo with a 2px ring; CSS-3D Y-axis flip obverse→reverse on
 * hover (tap on touch, button + aria-pressed for keyboard). A reeded-edge
 * tick ring appears and slowly rotates on hover. Falls back to the
 * empty-coin placeholder when an image is missing. prefers-reduced-motion
 * collapses the flip to a crossfade (handled in index.css).
 */

/** Renders an SVG asset recolored via currentColor (mask technique). */
export function SvgMask({ src, className, style }: { src: string; className?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        WebkitMaskImage: `url("${asset(src)}")`,
        maskImage: `url("${asset(src)}")`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        ...style,
      }}
    />
  );
}

/** The reeded-edge tick ring (appears/rotates around coins on hover). */
export function ReedRing({ className, spinning = true }: { className?: string; spinning?: boolean }) {
  return (
    <SvgMask
      src={asset("reed-ring.svg")}
      className={cn("pointer-events-none absolute -inset-2 text-brass", spinning && "animate-reed-spin", className)}
    />
  );
}

function Face({
  src,
  alt,
  back = false,
  onError,
}: {
  src?: string;
  alt: string;
  back?: boolean;
  onError: () => void;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "coin-face flex items-center justify-center rounded-full bg-inset text-ink-faint",
          back && "coin-face-back",
        )}
      >
        <SvgMask src={asset("empty-coin.svg")} className="size-1/2 opacity-60" />
      </div>
    );
  }
  return (
    <div className={cn("coin-face", back && "coin-face-back")}>
      <img
        src={asset(src)}
        alt={alt}
        loading="lazy"
        draggable={false}
        onError={onError}
        className="size-full select-none rounded-full object-cover"
      />
    </div>
  );
}

export interface CoinImageProps {
  /** Obverse image path/object URL. */
  obverse?: string;
  /** Reverse image path/object URL — enables the flip when `flippable`. */
  reverse?: string;
  alt: string;
  /** Diameter in px (default 160). */
  size?: number;
  /** Enable flip interaction (default true when a reverse exists). */
  flippable?: boolean;
  /** Show the rotating reed ring on hover (default true). */
  reedRing?: boolean;
  className?: string;
}

export default function CoinImage({
  obverse,
  reverse,
  alt,
  size = 160,
  flippable,
  reedRing = true,
  className,
}: CoinImageProps) {
  const [flipped, setFlipped] = useState(false);
  const [obvFailed, setObvFailed] = useState(false);
  const [revFailed, setRevFailed] = useState(false);

  const obvSrc = obvFailed ? undefined : obverse;
  const revSrc = revFailed ? undefined : reverse;
  const canFlip = (flippable ?? true) && Boolean(revSrc);

  const inner = (
    <div
      className="coin-flip-scene group/coin relative"
      style={{ width: size, height: size }}
    >
      <div className={cn("coin-flip-inner", canFlip && flipped && "is-flipped")}>
        <Face src={obvSrc} alt={alt} onError={() => setObvFailed(true)} />
        <Face src={revSrc} alt={`${alt} — reverse`} back onError={() => setRevFailed(true)} />
      </div>
      {/* 2px base ring */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full border-2 border-line-strong/60"
      />
      {/* reeded tick ring on hover */}
      {reedRing && (
        <ReedRing
          className={cn(
            "opacity-0 transition-opacity duration-300",
            "group-hover/coin:opacity-70",
            canFlip && flipped && "opacity-70",
          )}
        />
      )}
    </div>
  );

  if (!canFlip) {
    return (
      <div className={cn("relative inline-block", className)} role="img" aria-label={alt}>
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={flipped}
      aria-label={`${alt} — flip coin`}
      onClick={() => setFlipped((f) => !f)}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      className={cn("relative inline-block cursor-pointer rounded-full", className)}
    >
      {inner}
    </button>
  );
}
