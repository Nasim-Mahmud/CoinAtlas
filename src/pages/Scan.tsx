import { useCallback, useEffect, useState } from "react";
import { asset } from "@/lib/asset";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, Circle, Hand, History, ImageUp, Lock, ScanSearch, Sun, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SvgMask } from "@/components/coin/CoinImage";
import Viewfinder from "@/components/scan/Viewfinder";
import type { CameraErrorKind } from "@/components/scan/Viewfinder";
import ReviewCapture from "@/components/scan/ReviewCapture";
import UploadWell from "@/components/scan/UploadWell";
import { processCoinPhoto, processUploadedFile } from "@/components/scan/photo-processing";
import type { ProcessedPhoto } from "@/components/scan/photo-processing";
import { clearScanSession, loadScanSession, saveScanSession } from "@/lib/scan-session";

/**
 * SCAN — /scan (design: scan.md).
 * State machine: intro → capture(obverse) → review → capture(reverse) →
 * review → confirm → /identify. Every capture step has an upload escape;
 * the session persists so leaving mid-flow can resume from the intro.
 */

type Stage = "intro" | "capture" | "review" | "confirm";
type Side = "obverse" | "reverse";

const TIPS = [
  { icon: Sun, text: "Soft, even light — avoid glare" },
  { icon: Hand, text: "Steady, directly overhead" },
  { icon: Circle, text: "Fit the coin inside the ring" },
];

function cameraSupported(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

export default function Scan() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("intro");
  const [side, setSide] = useState<Side>("obverse");
  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [cameraError, setCameraError] = useState<CameraErrorKind | null>(null);
  const [obverse, setObverse] = useState<ProcessedPhoto | null>(null);
  const [reverse, setReverse] = useState<ProcessedPhoto | null>(null);
  const [pending, setPending] = useState<ProcessedPhoto | null>(null);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [resumeAvailable, setResumeAvailable] = useState(false);

  useEffect(() => {
    const s = loadScanSession();
    if (s?.obverse) setResumeAvailable(true);
  }, []);

  const resetAll = useCallback(() => {
    setObverse(null);
    setReverse(null);
    setPending(null);
    setUploadQueue([]);
    setSide("obverse");
    setMode("camera");
    setCameraError(null);
    clearScanSession();
    setResumeAvailable(false);
  }, []);

  const startCamera = useCallback(() => {
    if (!cameraSupported()) {
      setMode("upload");
      setCameraError("unavailable");
      setStage("capture");
      toast("Camera not supported in this browser", { description: "Upload photos instead — they're processed on-device." });
      return;
    }
    setMode("camera");
    setCameraError(null);
    setStage("capture");
  }, []);

  const startUpload = useCallback(() => {
    setMode("upload");
    setStage("capture");
  }, []);

  const resume = useCallback(() => {
    const s = loadScanSession();
    if (!s?.obverse) return;
    const stub = { brightness: 128, sharpness: 100, tooDark: false, soft: false };
    setObverse({ dataUrl: s.obverse, quality: stub });
    if (s.reverse) setReverse({ dataUrl: s.reverse, quality: stub });
    setStage("confirm");
  }, []);

  /* --- capture pipeline ------------------------------------------------ */

  const handleFrame = useCallback(async (frameDataUrl: string) => {
    setProcessing(true);
    try {
      const photo = await processCoinPhoto(frameDataUrl);
      setPending(photo);
      setStage("review");
    } catch {
      toast.error("Couldn't process that frame", { description: "Try again, or upload a photo instead." });
    } finally {
      setProcessing(false);
    }
  }, []);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const [first, ...rest] = files;
      setUploadQueue(rest.slice(0, 1)); // only one more side to fill
      setProcessing(true);
      try {
        const photo = await processUploadedFile(first);
        setPending(photo);
        setStage("review");
      } catch {
        toast.error("Couldn't read that photo", { description: "Try a different JPG, PNG or WEBP." });
      } finally {
        setProcessing(false);
      }
    },
    [],
  );

  const acceptPending = useCallback(async () => {
    if (!pending) return;
    if (side === "obverse") {
      setObverse(pending);
      setPending(null);
      setSide("reverse");
      // Queued second upload fills the reverse straight into review.
      if (uploadQueue.length > 0) {
        const [next, ...rest] = uploadQueue;
        setUploadQueue(rest);
        try {
          const photo = await processUploadedFile(next);
          setPending(photo);
          setStage("review");
          return;
        } catch {
          toast.error("The second photo couldn't be read — capture the reverse instead.");
        }
      }
      setStage("capture");
    } else {
      setReverse(pending);
      setPending(null);
      setStage("confirm");
    }
  }, [pending, side, uploadQueue]);

  const retakeSide = useCallback(
    (which: Side) => {
      setSide(which);
      setPending(null);
      setStage("capture");
    },
    [],
  );

  const handleCameraError = useCallback((kind: CameraErrorKind) => {
    setCameraError(kind);
    if (kind === "unavailable") {
      toast("No camera found", { description: "Upload photos instead — they're processed on-device." });
      setMode("upload");
    }
  }, []);

  /* --- exits ----------------------------------------------------------- */

  const finishIdentify = useCallback(() => {
    saveScanSession({ obverse: obverse?.dataUrl, reverse: reverse?.dataUrl });
    navigate("/identify");
  }, [navigate, obverse, reverse]);

  const finishManual = useCallback(() => {
    navigate("/add", {
      state: { prefill: { images: { obverse: obverse?.dataUrl, reverse: reverse?.dataUrl } } },
    });
    clearScanSession();
  }, [navigate, obverse, reverse]);

  const requestClose = useCallback(() => {
    if (obverse || reverse || pending) setConfirmClose(true);
    else setStage("intro");
  }, [obverse, reverse, pending]);

  const hasCapture = Boolean(obverse || reverse);

  /* --- render ---------------------------------------------------------- */

  const stepPills = (
    <div className="flex items-center gap-2" role="list" aria-label="Capture progress">
      {(["obverse", "reverse"] as const).map((s, i) => {
        const done = s === "obverse" ? Boolean(obverse) : Boolean(reverse);
        const active = stage !== "confirm" && side === s && stage !== "intro";
        return (
          <span
            key={s}
            role="listitem"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em]",
              done
                ? "border-patina/50 bg-patina/10 text-patina"
                : active
                  ? "border-brass/50 bg-brass/10 text-brass"
                  : "border-line text-ink-faint",
            )}
          >
            {done ? <Check className="size-3" aria-hidden /> : null}
            {i + 1} · {s}
          </span>
        );
      })}
    </div>
  );

  return (
    <div>
      {/* ------------------------------------------------ intro stage */}
      {stage === "intro" && (
        <div className="mx-auto flex max-w-[560px] flex-col items-center px-4 py-16 text-center">
          <motion.div
            className="relative flex size-28 items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.span
              aria-hidden
              className="absolute inset-0 text-brass"
              initial={{ rotate: -8 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <SvgMask src={asset("/reed-ring.svg")} className="size-full animate-reed-spin" />
            </motion.span>
            <span aria-hidden className="absolute inset-2 rounded-full border border-dashed border-brass/50" />
            <motion.span
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Camera className="size-8 text-brass" aria-hidden />
            </motion.span>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            className="flex flex-col items-center"
          >
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="mt-8 font-display text-[32px] font-semibold tracking-[-0.015em] text-ink"
            >
              Scan a coin
            </motion.h1>
            <motion.p
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="mt-3 max-w-[52ch] font-serif text-[15.5px] leading-[1.65] text-ink-dim"
            >
              Photograph one or both sides of the coin, then match them against the reference catalogue. One side is
              enough to search — and you'll review everything before it's filed.
            </motion.p>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="mt-6 flex flex-col items-start gap-2.5"
            >
              {TIPS.map((tip) => (
                <div key={tip.text} className="flex items-center gap-2.5 font-mono text-[12px] text-ink-dim">
                  <tip.icon className="size-4 text-brass" aria-hidden />
                  {tip.text}
                </div>
              ))}
            </motion.div>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              <motion.button
                type="button"
                onClick={startCamera}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-md bg-brass px-5 py-3 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#131009] transition-colors hover:bg-brass-bright"
              >
                <Camera className="size-4" /> Open camera
              </motion.button>
              <motion.button
                type="button"
                onClick={startUpload}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-md border border-line bg-bg-raised px-5 py-3 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
              >
                <ImageUp className="size-4" /> Upload photos instead
              </motion.button>
            </motion.div>

            {resumeAvailable && (
              <motion.button
                type="button"
                onClick={resume}
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.4 } } }}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-brass/40 bg-brass/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-brass transition-colors hover:border-brass"
              >
                <History className="size-3.5" /> Resume scan — photos on file
              </motion.button>
            )}

            <motion.p
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6 } } }}
              className="mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint"
            >
              Photos are processed on-device · Nothing is uploaded
            </motion.p>
          </motion.div>
        </div>
      )}

      {/* --------------------------------------- capture / review stage */}
      <AnimatePresence>
        {(stage === "capture" || stage === "review") && (
          <motion.div
            key="stage"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-inset lg:p-10"
          >
            <div className="relative flex size-full flex-col overflow-hidden bg-inset lg:max-h-[84vh] lg:max-w-[720px] lg:rounded-[16px] lg:border lg:border-line">
              {/* top bar */}
              <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 bg-gradient-to-b from-bg/80 to-transparent px-3 py-3 sm:px-4">
                {stepPills}
                <div className="flex items-center gap-2">
                  {stage === "capture" && side === "reverse" && (
                    <button
                      type="button"
                      onClick={() => setStage("confirm")}
                      className="rounded-full border border-brass/50 bg-bg/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-brass backdrop-blur transition-colors hover:border-brass hover:bg-brass/10"
                    >
                      <span className="max-sm:hidden">Skip reverse — one side is enough</span>
                      <span className="sm:hidden">Skip →</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={requestClose}
                    aria-label="Close scan"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-bg/60 text-ink backdrop-blur transition-colors hover:border-line-strong"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="relative flex-1">
                {stage === "capture" &&
                  (mode === "camera" && cameraError !== "denied" ? (
                    <Viewfinder
                      key={`${side}-${mode}`}
                      hint={
                        side === "obverse"
                          ? "Side 1 of 2 — photograph the obverse (heads / principal side)"
                          : "Side 2 of 2 — flip the coin and photograph the reverse"
                      }
                      onCapture={(frame) => void handleFrame(frame)}
                      onUploadInstead={() => setMode("upload")}
                      onCameraError={handleCameraError}
                    />
                  ) : cameraError === "denied" ? (
                    <div className="flex size-full flex-col items-center justify-center gap-4 px-8 text-center">
                      <motion.div
                        initial={{ x: 0 }}
                        animate={{ x: [0, -6, 6, -4, 4, 0] }}
                        transition={{ duration: 0.3 }}
                        className="flex size-14 items-center justify-center rounded-full border border-line bg-bg-raised"
                      >
                        <Lock className="size-6 text-copper" aria-hidden />
                      </motion.div>
                      <h2 className="font-display text-[22px] font-medium text-ink">Camera access is off</h2>
                      <p className="max-w-[46ch] font-serif text-[15px] leading-[1.65] text-ink-dim">
                        NUMISMA photographs coins only with your permission, and every photo stays on this device.
                      </p>
                      <p className="max-w-[52ch] font-mono text-[11px] leading-relaxed text-ink-faint">
                        iOS: Settings → Safari → Camera → Allow · Android: tap the lock icon in the address bar →
                        Permissions → Camera
                      </p>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-wrap items-center justify-center gap-3"
                      >
                        <button
                          type="button"
                          onClick={() => setCameraError(null)}
                          className="rounded-md border border-line bg-bg-raised px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
                        >
                          Try again
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCameraError(null);
                            setMode("upload");
                          }}
                          className="inline-flex items-center gap-2 rounded-md bg-brass px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#131009] transition-colors hover:bg-brass-bright"
                        >
                          <ImageUp className="size-4" /> Upload photos instead
                        </button>
                      </motion.div>
                    </div>
                  ) : (
                    <UploadWell key={`${side}-upload`} onFiles={(files) => void handleFiles(files)} />
                  ))}

                {stage === "review" && pending && (
                  <ReviewCapture
                    photoUrl={pending.dataUrl}
                    quality={pending.quality}
                    sideLabel={side}
                    uploadMode={mode === "upload"}
                    onRetake={() => {
                      setPending(null);
                      setStage("capture");
                    }}
                    onUse={() => void acceptPending()}
                  />
                )}

                {processing && stage === "capture" && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-inset/70">
                    <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-dim">Processing photo…</p>
                  </div>
                )}
              </div>

              {/* close confirmation */}
              <AnimatePresence>
                {confirmClose && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-bg/70 p-6 backdrop-blur-sm"
                    role="alertdialog"
                    aria-label="Discard photos?"
                  >
                    <motion.div
                      initial={{ scale: 0.96 }}
                      animate={{ scale: 1 }}
                      className="w-full max-w-[340px] rounded-[12px] border border-line bg-bg-raised p-6 text-center"
                    >
                      <h3 className="font-display text-[19px] font-medium text-ink">Discard photos?</h3>
                      <p className="mt-2 font-serif text-[14.5px] leading-[1.6] text-ink-dim">
                        The captures from this session will be thrown away.
                      </p>
                      <div className="mt-5 flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setConfirmClose(false)}
                          className="rounded-md border border-line bg-bg-raised px-4 py-2 font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-ink hover:border-line-strong"
                        >
                          Keep scanning
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmClose(false);
                            resetAll();
                            setStage("intro");
                          }}
                          className="rounded-md border border-oxblood/50 bg-oxblood/10 px-4 py-2 font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-oxblood hover:border-oxblood"
                        >
                          Discard
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------ confirm stage */}
      {stage === "confirm" && (
        <div className="mx-auto flex max-w-[640px] flex-col items-center px-4 py-16 text-center">
          <p className="overline-label">REVIEW YOUR CAPTURES</p>
          <h1 className="mt-3 font-display text-[28px] font-semibold tracking-[-0.015em] text-ink md:text-[32px]">
            {reverse ? "Both sides, ready for the loupe" : "One side captured — ready to identify"}
          </h1>
          <p className="mt-3 max-w-[52ch] font-serif text-[15.5px] leading-[1.65] text-ink-dim">
            Tap a photo to retake that side — or add the other side if you skipped it. One side is enough to identify.
          </p>

          <div className="mt-10 flex items-center justify-center gap-8 md:gap-14">
            {(
              [
                { label: "OBVERSE", photo: obverse, side: "obverse" as const, from: -40 },
                { label: "REVERSE", photo: reverse, side: "reverse" as const, from: 40 },
              ] as const
            ).map(({ label, photo, side: s, from }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: from }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => retakeSide(s)}
                  aria-label={photo ? `Retake ${label.toLowerCase()}` : `Add ${label.toLowerCase()} photo`}
                  className="group relative block rounded-full"
                >
                  <span
                    className={cn(
                      "block size-32 overflow-hidden rounded-full border-2 transition-colors md:size-40",
                      photo ? "border-line-strong/60 group-hover:border-brass" : "border-dashed border-line",
                    )}
                  >
                    {photo ? (
                      <img src={photo.dataUrl} alt={`${label.toLowerCase()} capture`} className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center bg-inset text-ink-faint">
                        <Camera className="size-6" aria-hidden />
                      </span>
                    )}
                  </span>
                </button>
                <span className="overline-label">{label}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex w-full flex-col items-center gap-3">
            <motion.button
              type="button"
              onClick={finishIdentify}
              disabled={!hasCapture}
              whileTap={{ scale: 0.97 }}
              initial={{ boxShadow: "0 0 0 0 rgb(var(--brass) / 0)" }}
              animate={{ boxShadow: ["0 0 0 0 rgb(var(--brass) / 0.35)", "0 0 0 14px rgb(var(--brass) / 0)"] }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="inline-flex w-full max-w-[360px] items-center justify-center gap-2 rounded-md bg-brass px-5 py-3 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#131009] transition-colors hover:bg-brass-bright disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ScanSearch className="size-4" /> Identify this coin
            </motion.button>
            <button
              type="button"
              onClick={finishManual}
              disabled={!hasCapture}
              className="inline-flex w-full max-w-[360px] items-center justify-center gap-2 rounded-md border border-line bg-bg-raised px-5 py-3 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              Catalogue manually instead
            </button>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Identification runs entirely in your browser
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
