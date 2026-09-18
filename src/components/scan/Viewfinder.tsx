import { useCallback, useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { Flashlight, FlashlightOff, ImageUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { SvgMask } from "@/components/coin/CoinImage";

/**
 * Live viewfinder (scan.md §Step 1): react-webcam rear camera, crosshair
 * cursor, circular alignment guide (reed ring + dashed inner + ticks),
 * dimmed surround, steadiness detection that turns the ring patina and
 * auto-captures after a 1.2s hold, manual shutter always available, torch
 * toggle where the device supports it.
 */

export type CameraErrorKind = "denied" | "unavailable";

export interface ViewfinderProps {
  /** Called with the raw frame data URL when a capture happens. */
  onCapture: (frameDataUrl: string) => void;
  /** Escape hatch — switch this step to the upload variant. */
  onUploadInstead: () => void;
  /** Bottom hint, e.g. "Side 1 of 2 — photograph the obverse…". */
  hint: string;
  onCameraError: (kind: CameraErrorKind) => void;
}

/** Sample interval + thresholds for the frame-diff steadiness heuristic. */
const SAMPLE_MS = 180;
const STABLE_DIFF = 3.2; // mean abs luminance diff (0–255) considered "still"
const STABLE_SAMPLES = 4; // consecutive still samples (~720ms) before hold
const HOLD_MS = 1200; // countdown sweep before auto-capture

export default function Viewfinder({ onCapture, onUploadInstead, hint, onCameraError }: ViewfinderProps) {
  const webcamRef = useRef<Webcam>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [stable, setStable] = useState(false);
  const [flash, setFlash] = useState(0);

  const sampleRef = useRef<{ prev: Uint8ClampedArray | null; still: number }>({ prev: null, still: 0 });
  const stableRef = useRef(false);
  const holdTimer = useRef<number | null>(null);
  const capturedRef = useRef(false);

  const doCapture = useCallback(() => {
    if (capturedRef.current) return;
    const shot = webcamRef.current?.getScreenshot();
    if (!shot) return;
    capturedRef.current = true;
    setFlash((f) => f + 1);
    // Let the flash read as a shutter before the frozen review appears.
    window.setTimeout(() => onCapture(shot), 140);
  }, [onCapture]);

  /* Torch support detection (once the stream is live). */
  const handleUserMedia = useCallback(() => {
    try {
      const stream = webcamRef.current?.stream;
      const track = stream?.getVideoTracks()[0];
      const caps = track?.getCapabilities?.() as unknown as { torch?: boolean } | undefined;
      setTorchSupported(Boolean(caps?.torch));
    } catch {
      setTorchSupported(false);
    }
  }, []);

  const toggleTorch = useCallback(async () => {
    try {
      const track = webcamRef.current?.stream?.getVideoTracks()[0];
      if (!track) return;
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next } as unknown as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  }, [torchOn]);

  /* Steadiness detection: mean abs luminance diff between tiny samples. */
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const interval = window.setInterval(() => {
      try {
        const video = webcamRef.current?.video;
        if (!video || video.readyState < 2 || capturedRef.current) return;
        ctx.drawImage(video, 0, 0, 48, 48);
        const { data } = ctx.getImageData(0, 0, 48, 48);
        const lum = new Uint8ClampedArray(48 * 48);
        for (let i = 0; i < 48 * 48; i++) {
          lum[i] = (data[i * 4] * 3 + data[i * 4 + 1] * 4 + data[i * 4 + 2]) >> 3;
        }
        const state = sampleRef.current;
        if (state.prev) {
          let diff = 0;
          for (let i = 0; i < lum.length; i++) diff += Math.abs(lum[i] - state.prev[i]);
          const meanDiff = diff / lum.length;
          if (meanDiff < STABLE_DIFF) {
            state.still += 1;
          } else {
            state.still = 0;
          }
          const nowStable = state.still >= STABLE_SAMPLES;
          if (nowStable !== stableRef.current) {
            stableRef.current = nowStable;
            setStable(nowStable);
          }
        }
        state.prev = lum;
      } catch {
        /* sampling is best-effort */
      }
    }, SAMPLE_MS);

    return () => window.clearInterval(interval);
  }, []);

  /* Auto-capture after a steady hold; movement cancels the countdown. */
  useEffect(() => {
    if (stable) {
      holdTimer.current = window.setTimeout(() => doCapture(), HOLD_MS);
      return () => {
        if (holdTimer.current) window.clearTimeout(holdTimer.current);
        holdTimer.current = null;
      };
    }
    return undefined;
  }, [stable, doCapture]);

  return (
    <div ref={videoWrapRef} className="relative size-full cursor-crosshair overflow-hidden bg-inset">
      <style>{`@keyframes scan-hold-sweep { from { stroke-dashoffset: ${2 * Math.PI * 49}; } to { stroke-dashoffset: 0; } }`}</style>
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.92}
        videoConstraints={{ facingMode }}
        onUserMedia={handleUserMedia}
        onUserMediaError={(err) => {
          const name = typeof err === "string" ? err : err?.name;
          onCameraError(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
        }}
        className="absolute inset-0 size-full object-cover"
      />

      {/* Dimmed surround outside the guide circle */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent min(33vw, 25vh, 220px), rgb(var(--bg) / 0.55) calc(min(33vw, 25vh, 220px) + 2px))",
        }}
      />

      {/* Alignment guide */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: "min(72vw, 54vh, 460px)", height: "min(72vw, 54vh, 460px)" }}
        animate={{ opacity: [0.6, 0.85, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* reeded outer ring */}
        <SvgMask
          src={asset("/reed-ring.svg")}
          className={cn("absolute -inset-3 transition-colors duration-300", stable ? "text-patina" : "text-brass/60")}
        />
        {/* inner dashed circle → solid patina when stable */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 transition-all duration-300",
            stable ? "border-solid border-patina" : "border-dashed border-brass/70",
          )}
        />
        {/* crosshair ticks at 12/3/6/9 */}
        {[
          "left-1/2 top-0 h-4 w-px -translate-x-1/2 -translate-y-1",
          "left-1/2 bottom-0 h-4 w-px -translate-x-1/2 translate-y-1",
          "top-1/2 left-0 w-4 h-px -translate-y-1/2 -translate-x-1",
          "top-1/2 right-0 w-4 h-px -translate-y-1/2 translate-x-1",
        ].map((pos) => (
          <span key={pos} className={cn("absolute transition-colors", stable ? "bg-patina" : "bg-brass/80", pos)} />
        ))}
        {/* auto-capture countdown sweep */}
        {stable && (
          <svg viewBox="0 0 100 100" className="absolute -inset-1 size-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="49"
              fill="none"
              stroke="rgb(var(--patina))"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 49}
              style={{
                animation: `scan-hold-sweep ${HOLD_MS}ms linear forwards`,
                strokeDashoffset: 2 * Math.PI * 49,
              }}
            />
          </svg>
        )}
      </motion.div>

      {/* shutter flash */}
      <AnimatePresence>
        {flash > 0 && (
          <motion.div
            key={flash}
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[#F5EEDF]"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          />
        )}
      </AnimatePresence>

      {/* corner controls */}
      <div className="absolute right-3 top-16 flex flex-col gap-2 sm:right-4">
        {torchSupported && (
          <button
            type="button"
            onClick={() => void toggleTorch()}
            aria-pressed={torchOn}
            aria-label={torchOn ? "Torch off" : "Torch on"}
            className="flex size-10 items-center justify-center rounded-full border border-line bg-bg/60 text-ink backdrop-blur transition-colors hover:border-line-strong"
          >
            {torchOn ? <Flashlight className="size-4 text-brass" /> : <FlashlightOff className="size-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={() => setFacingMode((m) => (m === "environment" ? "user" : "environment"))}
          aria-label="Flip camera"
          className="flex size-10 items-center justify-center rounded-full border border-line bg-bg/60 text-ink backdrop-blur transition-colors hover:border-line-strong"
        >
          <RefreshCw className="size-4" />
        </button>
      </div>

      {/* bottom cluster: caption + shutter + upload escape */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2.5 bg-gradient-to-t from-bg/80 to-transparent px-4 pb-4 pt-8 sm:gap-4 sm:px-6 sm:pb-6 sm:pt-10">
        <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-dim">
          {stable ? "Hold steady…" : "Align the coin"}
        </p>
        <motion.button
          type="button"
          onClick={doCapture}
          whileTap={{ scale: 0.9 }}
          aria-label="Capture photo"
          className="flex size-[68px] items-center justify-center rounded-full border-[3px] border-ink/90 bg-transparent"
        >
          <span className="size-[52px] rounded-full bg-brass transition-colors hover:bg-brass-bright" />
        </motion.button>
        <p className="max-w-[46ch] text-center font-mono text-[12px] leading-relaxed text-ink-dim">{hint}</p>
        <button
          type="button"
          onClick={onUploadInstead}
          className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-dim transition-colors hover:text-ink"
        >
          <ImageUp className="size-4" /> Upload instead
        </button>
      </div>
    </div>
  );
}
