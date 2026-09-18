import { useRef, useState } from "react";
import { ArrowLeftRight, Camera, ImageUp, Loader2, RefreshCw, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { CoinImages } from "@/types/coin";
import { cn } from "@/lib/utils";
import { compressImageFile } from "@/components/form/form-utils";

/**
 * Photo slots (add-edit.md §05): circular OBVERSE / REVERSE drop slots +
 * smaller rounded EDGE slot. Capture (mobile camera) or upload; images are
 * compressed client-side to ≤1024px JPEG 0.82 data URLs. Replace / remove /
 * swap sides supported.
 */

type Side = "obverse" | "reverse" | "edge";

interface SlotProps {
  side: Side;
  label: string;
  value?: string;
  round?: boolean;
  size: number;
  onFile: (side: Side, file: File) => void;
  onRemove: (side: Side) => void;
  busy: boolean;
  fromScan?: boolean;
}

function Slot({ side, label, value, round = true, size, onFile, onRemove, busy, fromScan }: SlotProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const browseRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pick = (files: FileList | null) => {
    const f = files?.[0];
    if (f) onFile(side, f);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        role="button"
        tabIndex={0}
        aria-label={`${label} photo — drop, browse or capture`}
        onClick={() => !value && browseRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !value) {
            e.preventDefault();
            browseRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files);
        }}
        className={cn(
          "group relative flex cursor-pointer items-center justify-center overflow-hidden border transition-colors",
          round ? "rounded-full" : "rounded-md",
          value ? "border-line" : "border-dashed border-line-strong bg-bg-inset/40",
          dragOver && "border-brass bg-brass/5",
          !value && "hover:border-brass/60",
        )}
        style={{ width: size, height: size }}
      >
        {value ? (
          <>
            <motion.img
              key={value.slice(0, 64)}
              src={value}
              alt={`${label} of coin`}
              initial={{ scale: 1.15, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-bg/70 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <button
                type="button"
                aria-label={`Replace ${label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  browseRef.current?.click();
                }}
                className="rounded-full border border-line bg-bg-raised p-2 text-ink transition-colors hover:border-brass hover:text-brass"
              >
                <RefreshCw className="size-3.5" aria-hidden />
              </button>
              <button
                type="button"
                aria-label={`Remove ${label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(side);
                }}
                className="rounded-full border border-line bg-bg-raised p-2 text-ink transition-colors hover:border-oxblood hover:text-oxblood"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          </>
        ) : busy ? (
          <Loader2 className="size-5 animate-spin text-ink-faint" aria-label="Compressing image" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-2 text-center">
            <ImageUp className="size-5 text-ink-faint" aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              Drop or browse
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">{label}</span>
        {fromScan && value && (
          <span className="rounded-full border border-brass/40 bg-brass/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.08em] text-brass">
            From scan
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex items-center gap-1 rounded-full border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint transition-colors hover:border-line-strong hover:text-ink"
        >
          <Camera className="size-3" aria-hidden />
          Capture
        </button>
        <button
          type="button"
          onClick={() => browseRef.current?.click()}
          className="rounded-full border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint transition-colors hover:border-line-strong hover:text-ink"
        >
          Browse
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={browseRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export interface ImageSlotsProps {
  images: CoinImages;
  onChange: (images: CoinImages) => void;
  /** True when images arrived prefilled from the scan flow. */
  fromScan?: boolean;
}

export default function ImageSlots({ images, onChange, fromScan }: ImageSlotsProps) {
  const [busySide, setBusySide] = useState<Side | null>(null);

  const handleFile = async (side: Side, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("That file is not an image.");
      return;
    }
    setBusySide(side);
    try {
      const dataUrl = await compressImageFile(file, 1024, 0.82);
      onChange({ ...images, [side]: dataUrl });
    } catch {
      toast.error("Could not read that image.");
    } finally {
      setBusySide(null);
    }
  };

  const remove = (side: Side) => {
    const next = { ...images };
    delete next[side];
    onChange(next);
  };

  const swap = () => {
    onChange({ ...images, obverse: images.reverse, reverse: images.obverse });
  };

  return (
    <div>
      <div className="flex flex-wrap items-start gap-6">
        <Slot
          side="obverse"
          label="Obverse"
          value={images.obverse}
          size={160}
          onFile={handleFile}
          onRemove={remove}
          busy={busySide === "obverse"}
          fromScan={fromScan}
        />
        <div className="flex flex-col items-center gap-2 self-center">
          <button
            type="button"
            onClick={swap}
            disabled={!images.obverse && !images.reverse}
            aria-label="Swap obverse and reverse"
            title="Swap sides"
            className="rounded-full border border-line bg-bg-raised p-2.5 text-ink-dim transition-all hover:border-brass hover:text-brass disabled:opacity-40"
          >
            <ArrowLeftRight className="size-4" aria-hidden />
          </button>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint">Swap</span>
        </div>
        <Slot
          side="reverse"
          label="Reverse"
          value={images.reverse}
          size={160}
          onFile={handleFile}
          onRemove={remove}
          busy={busySide === "reverse"}
          fromScan={fromScan}
        />
        <Slot
          side="edge"
          label="Edge (optional)"
          value={images.edge}
          round={false}
          size={96}
          onFile={handleFile}
          onRemove={remove}
          busy={busySide === "edge"}
          fromScan={fromScan}
        />
      </div>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
        Stored locally · compressed to ~1024px JPEG
      </p>
    </div>
  );
}
