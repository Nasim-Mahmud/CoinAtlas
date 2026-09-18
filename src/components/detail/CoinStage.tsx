import { useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import type { PanInfo } from "framer-motion";
import { FlipHorizontal2, ZoomIn } from "lucide-react";
import type { Coin } from "@/types/coin";
import { cn } from "@/lib/utils";
import { ReedRing, SvgMask } from "@/components/coin/CoinImage";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * The display case (coin-detail.md §1 left): guilloché stage with spot glow,
 * a drag-to-flip coin (spring snap to nearest 180°), gentle sway on load,
 * hover magnify (desktop), thumbnail strip, and a lightbox zoom dialog.
 */

type Face = "obverse" | "reverse" | "edge";

function StageImage({
  src,
  alt,
  className,
  zooming,
  zoomOrigin,
}: {
  src?: string;
  alt: string;
  className?: string;
  zooming: boolean;
  zoomOrigin: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={cn("flex items-center justify-center rounded-full bg-inset text-ink-faint", className)}>
        <SvgMask src={asset("/empty-coin.svg")} className="size-1/2 opacity-60" />
      </div>
    );
  }
  return (
    <div className={cn("overflow-hidden rounded-full", className)}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        onError={() => setFailed(true)}
        className="size-full select-none rounded-full object-cover transition-transform duration-150"
        style={{
          transform: zooming ? "scale(1.6)" : undefined,
          transformOrigin: zoomOrigin,
        }}
      />
    </div>
  );
}

export default function CoinStage({ coin }: { coin: Coin }) {
  const reduced = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const [swaying, setSwaying] = useState(!reduced);
  const [zooming, setZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [lightbox, setLightbox] = useState<Face | null>(null);
  const dragRot = useMotionValue(0);
  const dragging = useRef(false);

  const onDrag = (_: unknown, info: PanInfo) => {
    dragRot.set(info.offset.x * 0.7);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    dragging.current = false;
    if (info.offset.x < -60) setFlipped(true);
    else if (info.offset.x > 60) setFlipped(false);
    animate(dragRot, 0, { type: "spring", stiffness: 300, damping: 25 });
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setZoomOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  };

  const openLightbox = () => {
    if (dragging.current) return;
    setLightbox(flipped ? "reverse" : "obverse");
  };

  const thumbs: { face: Face; src?: string; label: string }[] = [
    { face: "obverse", src: coin.images.obverse, label: "Obverse" },
    { face: "reverse", src: coin.images.reverse, label: "Reverse" },
    ...(coin.images.edge ? [{ face: "edge" as Face, src: coin.images.edge, label: "Edge" }] : []),
  ];

  const lightboxSrc =
    lightbox === "reverse"
      ? coin.images.reverse
      : lightbox === "edge"
        ? coin.images.edge
        : coin.images.obverse;

  return (
    <div>
      {/* stage */}
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-[16px] border border-line bg-inset p-8 sm:p-10"
      >
        <SvgMask
          src={asset("/guilloche-pattern.svg")}
          className="pointer-events-none absolute inset-0 size-full rounded-[16px] text-ink opacity-[0.05]"
          style={{ WebkitMaskSize: "480px", maskSize: "480px" }}
        />
        <div aria-hidden className="spot-glow pointer-events-none absolute inset-8 rounded-full" />

        {/* the coin */}
        <div
          className="coin-flip-scene relative mx-auto aspect-square w-[min(100%,420px)] cursor-grab active:cursor-grabbing"
          onMouseMove={onMove}
          onMouseEnter={() => setZooming(true)}
          onMouseLeave={() => setZooming(false)}
        >
          <motion.div
            className="size-full"
            style={{ transformStyle: "preserve-3d" }}
            initial={false}
            animate={
              swaying
                ? { rotateY: [0, 14, -8, 0] }
                : { rotateY: flipped ? 180 : 0 }
            }
            transition={
              swaying
                ? { duration: 2, ease: "easeOut" }
                : reduced
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 200, damping: 22 }
            }
            onAnimationComplete={() => swaying && setSwaying(false)}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragStart={() => {
              dragging.current = true;
              setSwaying(false);
            }}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            onClick={openLightbox}
            role="button"
            tabIndex={0}
            aria-pressed={flipped}
            aria-label={`${coin.title} — showing ${flipped ? "reverse" : "obverse"}. Activate to zoom.`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openLightbox();
              }
            }}
          >
            <motion.div className="size-full" style={{ rotateY: dragRot, transformStyle: "preserve-3d" }}>
              <div className="coin-face">
                <StageImage
                  src={coin.images.obverse}
                  alt={`${coin.title} — obverse`}
                  className="size-full"
                  zooming={zooming && !flipped}
                  zoomOrigin={zoomOrigin}
                />
              </div>
              <div className="coin-face coin-face-back">
                <StageImage
                  src={coin.images.reverse}
                  alt={`${coin.title} — reverse`}
                  className="size-full"
                  zooming={zooming && flipped}
                  zoomOrigin={zoomOrigin}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* base ring + reed ring */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-line-strong/60"
          />
          <ReedRing className="opacity-40" />

          {/* corner captions */}
          <span className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            {flipped ? "Reverse" : "Obverse"}
          </span>
          <span className="pointer-events-none absolute right-1 top-1 grid size-7 place-items-center rounded-full border border-line bg-bg-raised/80 text-ink-faint">
            <ZoomIn className="size-3.5" />
          </span>
        </div>
      </motion.div>

      {/* flip button + thumbnail strip */}
      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {thumbs.map((t) => {
            const activeFace = t.face === "edge" ? false : flipped === (t.face === "reverse");
            return (
              <button
                key={t.face}
                type="button"
                aria-label={t.face === "edge" ? "View edge" : `Show ${t.label}`}
                aria-pressed={t.face === "edge" ? undefined : activeFace}
                onClick={() => {
                  if (t.face === "edge") setLightbox("edge");
                  else {
                    setSwaying(false);
                    setFlipped(t.face === "reverse");
                  }
                }}
                className={cn(
                  "relative size-12 overflow-hidden rounded-full border-2 transition-colors",
                  activeFace ? "border-brass" : "border-line hover:border-line-strong",
                )}
              >
                {t.src ? (
                  <img src={t.src} alt="" className="size-full object-cover" draggable={false} />
                ) : (
                  <span className="grid size-full place-items-center bg-inset text-ink-faint">
                    <SvgMask src={asset("/empty-coin.svg")} className="size-2/3 opacity-60" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-pressed={flipped}
          onClick={() => {
            setSwaying(false);
            setFlipped((f) => !f);
          }}
          className="flex items-center gap-2 rounded-md border border-line bg-bg-raised px-3.5 py-2 font-mono text-[12px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
        >
          <FlipHorizontal2 className="size-4 text-brass" />
          Flip
        </button>
      </div>

      {/* lightbox */}
      <Dialog open={lightbox != null} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-[92vw] border-line bg-bg-inset sm:max-w-[640px]">
          <DialogTitle className="font-mono text-[12px] uppercase tracking-[0.18em] text-ink-faint">
            {coin.title} — {lightbox}
          </DialogTitle>
          <div className="mx-auto w-full max-w-[520px]">
            {lightboxSrc ? (
              <img
                src={lightboxSrc}
                alt={`${coin.title} — ${lightbox}`}
                className={cn(
                  "w-full select-none object-contain",
                  lightbox === "edge" ? "rounded-md" : "aspect-square rounded-full object-cover",
                )}
                draggable={false}
              />
            ) : (
              <div className="grid aspect-square w-full place-items-center rounded-full bg-bg-raised text-ink-faint">
                <SvgMask src={asset("/empty-coin.svg")} className="size-1/3 opacity-60" />
              </div>
            )}
          </div>
          <div className="flex justify-center gap-2">
            {thumbs.map((t) => (
              <button
                key={t.face}
                type="button"
                onClick={() => setLightbox(t.face)}
                className={cn(
                  "rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
                  lightbox === t.face
                    ? "border-brass bg-brass/10 text-brass"
                    : "border-line text-ink-dim hover:border-line-strong",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
