import { motion } from "framer-motion";
import { AlertTriangle, Check, RotateCcw } from "lucide-react";
import { ReedRing } from "@/components/coin/CoinImage";
import type { PhotoQuality } from "@/components/scan/photo-processing";
import { cn } from "@/lib/utils";

/**
 * Review capture (scan.md §Step 2): the frozen photo masked as a perfect
 * circle inside the reed ring — exactly how it will look in the catalogue —
 * with auto quality heuristics and retake / use-this-photo actions.
 */

export interface ReviewCaptureProps {
  photoUrl: string;
  quality: PhotoQuality;
  /** "OBVERSE" / "REVERSE" — used in the checklist heading. */
  sideLabel: string;
  /** Upload variant changes the retake wording. */
  uploadMode?: boolean;
  onRetake: () => void;
  onUse: () => void;
}

function QualityRow({ ok, okText, warnText }: { ok: boolean; okText: string; warnText: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em]">
      {ok ? (
        <Check className="size-3.5 shrink-0 text-patina" aria-hidden />
      ) : (
        <AlertTriangle className="size-3.5 shrink-0 text-copper" aria-hidden />
      )}
      <span className={ok ? "text-patina" : "text-copper"}>{ok ? okText : warnText}</span>
    </div>
  );
}

export default function ReviewCapture({ photoUrl, quality, sideLabel, uploadMode, onRetake, onUse }: ReviewCaptureProps) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-6 bg-inset px-6 py-8">
      <div className="relative">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-full"
          style={{ width: "min(58vw, 46vh, 320px)", height: "min(58vw, 46vh, 320px)" }}
        >
          <img src={photoUrl} alt={`${sideLabel.toLowerCase()} capture`} className="size-full rounded-full object-cover" />
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full border-2 border-line-strong/60" />
        </motion.div>
        <ReedRing className="opacity-70" spinning={false} />
      </div>

      <div className="text-center">
        <p className="overline-label">{sideLabel} · REVIEW</p>
        <motion.div
          className="mt-3 flex flex-col items-start gap-2"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        >
          {[
            <QualityRow key="sharp" ok={!quality.soft} okText="Sharp enough" warnText="A bit soft — retake?" />,
            <QualityRow key="light" ok={!quality.tooDark} okText="Well lit" warnText="A bit dark — retake?" />,
          ].map((row, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
            >
              {row}
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className={cn("flex flex-wrap items-center justify-center gap-3")}>
        <motion.button
          type="button"
          onClick={onRetake}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 rounded-md border border-line bg-bg-raised px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
        >
          <RotateCcw className="size-4" />
          {uploadMode ? "Choose different photo" : "Retake"}
        </motion.button>
        <motion.button
          type="button"
          onClick={onUse}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 rounded-md bg-brass px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#131009] transition-colors hover:bg-brass-bright"
        >
          <Check className="size-4" />
          Use this photo
        </motion.button>
      </div>
    </div>
  );
}
