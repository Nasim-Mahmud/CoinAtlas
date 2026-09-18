import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArrowRight,
  Camera,
  Check,
  Columns2,
  HelpCircle,
  ImageUp,
  Search,
  Stamp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Coin } from "@/types/coin";
import { addCoin, coinTitle, formatAccession, fuseSearch, useCoin, useCoins } from "@/hooks/useCoins";
import { buildSeedCoins } from "@/lib/db";
import CoinImage from "@/components/coin/CoinImage";
import ConfidenceBar from "@/components/coin/ConfidenceBar";
import EmptyState from "@/components/EmptyState";
import SectionHeader from "@/components/SectionHeader";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  buildReferenceEntries,
  createLocalProvider,
  runIdentification,
  LOW_CONFIDENCE_THRESHOLD,
} from "@/lib/identify";
import type { Candidate } from "@/lib/identify";
import { clearScanSession, loadScanSession } from "@/lib/scan-session";

/**
 * IDENTIFY — /identify (design: identify.md).
 * The "expert consultation": captured photos vs ranked on-device candidates.
 * Identification is always a suggestion — "attribution, pending review" —
 * and "none of these" is a first-class path. Fully offline; no keys.
 */

interface ScanPhotos {
  obverse?: string;
  reverse?: string;
}

interface SelectedCandidate {
  coin: Coin;
  confidence: number | null; // null = manual pick, no confidence claim
  reasons: string[];
  sourceLabel: string;
}

/** Metadata the /add form receives when filing a candidate (contract). */
function buildPrefill(sel: SelectedCandidate, photos: ScanPhotos): Partial<Coin> & { images: ScanPhotos } {
  const c = sel.coin;
  return {
    title: c.title,
    country: c.country,
    issuer: c.issuer,
    denomination: c.denomination,
    currency: c.currency,
    year: c.year,
    era: c.era,
    mint: c.mint,
    mintMark: c.mintMark,
    composition: c.composition,
    weightG: c.weightG,
    diameterMm: c.diameterMm,
    thicknessMm: c.thicknessMm,
    shape: c.shape,
    edge: c.edge,
    obverseDesc: c.obverseDesc,
    reverseDesc: c.reverseDesc,
    designer: c.designer,
    engraver: c.engraver,
    mintage: c.mintage,
    catalogRefs: c.catalogRefs,
    sources: c.sources,
    tags: [...c.tags],
    status: "pending",
    confidence: sel.confidence ?? undefined,
    images: { obverse: photos.obverse, reverse: photos.reverse },
    notes: `Attribution suggested by on-device matching${
      sel.confidence != null ? ` (${sel.confidence}% confidence)` : ""
    } — pending review.`,
  };
}

function confidenceTone(v: number): string {
  if (v >= 80) return "text-patina";
  if (v >= 50) return "text-brass";
  return "text-copper";
}

/* ------------------------------------------------------- analyzing phase */

const ANALYZE_LINES = ["Reading edge & shape…", "Matching portrait features…", "Ranking candidates…"];

function useTypewriter(lines: string[], active: boolean): string {
  const [text, setText] = useState("");
  const state = useRef({ line: 0, char: 0, hold: 0 });
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      const s = state.current;
      const line = lines[s.line % lines.length];
      if (s.char < line.length) {
        s.char += 1;
        setText(line.slice(0, s.char));
      } else if (s.hold < 8) {
        s.hold += 1;
      } else {
        s.line += 1;
        s.char = 0;
        s.hold = 0;
      }
    }, 42);
    return () => window.clearInterval(id);
  }, [lines, active]);
  return text;
}

function SweepCircle({ src, alt, delay = 0 }: { src?: string; alt: string; delay?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative size-24 overflow-hidden rounded-full border-2 border-line-strong/60"
    >
      {src ? (
        <img src={src} alt={alt} className="size-full rounded-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center bg-inset text-ink-faint">
          <Camera className="size-5" aria-hidden />
        </div>
      )}
      {/* scanning sweep bar, masked to the circle */}
      <span
        aria-hidden
        className="absolute inset-x-0 h-8"
        style={{
          background: "linear-gradient(to bottom, transparent, rgb(var(--brass) / 0.45), transparent)",
          animation: `identify-sweep 1.6s linear ${delay}s infinite`,
        }}
      />
    </motion.div>
  );
}

function AnalyzingPanel({ photos }: { photos: ScanPhotos }) {
  const line = useTypewriter(ANALYZE_LINES, true);
  return (
    <div className="mx-auto flex max-w-[480px] flex-col items-center px-4 py-24 text-center">
      <style>{`
        @keyframes identify-sweep { 0% { top: -25%; } 100% { top: 110%; } }
        @keyframes identify-slide { 0% { left: -30%; } 100% { left: 100%; } }
      `}</style>
      <div className="flex items-center gap-6">
        <SweepCircle src={photos.obverse} alt="Captured obverse" />
        <SweepCircle src={photos.reverse} alt="Captured reverse" delay={0.4} />
      </div>
      <p className="mt-8 h-5 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-dim" aria-live="polite">
        {line}
        <span className="text-brass">▌</span>
      </p>
      <div className="relative mt-4 h-[2px] w-56 overflow-hidden rounded-full bg-line">
        <span
          aria-hidden
          className="absolute top-0 h-full w-1/3 rounded-full bg-brass"
          style={{ animation: "identify-slide 1.2s ease-in-out infinite" }}
        />
      </div>
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        Matching on-device · Nothing leaves your browser
      </p>
    </div>
  );
}

/* ------------------------------------------------------ manual search */

function ManualSearchPanel({
  corpus,
  onSelect,
}: {
  corpus: Coin[];
  onSelect: (coin: Coin) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => (query.trim() ? fuseSearch(corpus, query).slice(0, 8) : []), [corpus, query]);
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="rounded-[12px] border border-line bg-bg-raised p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by country, denomination, year, KM#…"
            className="h-10 w-full rounded-md border border-line bg-inset pl-9 pr-3 font-mono text-[14px] text-ink placeholder:text-ink-faint focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/25"
            aria-label="Search the catalogue"
          />
        </div>
        {query.trim() && (
          <motion.ul
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
            className="mt-3 divide-y divide-line/50"
          >
            {results.length === 0 && (
              <li className="py-4 text-center font-mono text-[12px] text-ink-faint">No catalogue entries match.</li>
            )}
            {results.map((coin) => (
              <motion.li
                key={coin.id}
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } }}
                className="flex items-center gap-3 py-2.5"
              >
                <CoinImage obverse={coin.images.obverse} alt={coinTitle(coin)} size={48} flippable={false} reedRing={false} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[15px] font-medium text-ink">{coinTitle(coin)}</p>
                  <p className="truncate font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                    {coin.catalogRefs[0] ? `${coin.catalogRefs[0].system}# ${coin.catalogRefs[0].code} · ` : ""}
                    {coin.composition ?? coin.country}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(coin)}
                  className="shrink-0 rounded-md border border-line bg-bg-raised px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-brass hover:text-brass"
                >
                  Select
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------- compare dialog */

const COMPARE_FIELDS: { label: string; get: (c: Coin) => string | undefined }[] = [
  { label: "Denomination", get: (c) => c.denomination },
  { label: "Year / era", get: (c) => (c.year != null ? String(c.year) : c.era) },
  { label: "Composition", get: (c) => c.composition },
  { label: "Weight", get: (c) => (c.weightG != null ? `${c.weightG} g` : undefined) },
  { label: "Diameter", get: (c) => (c.diameterMm != null ? `${c.diameterMm} mm` : undefined) },
  { label: "Edge", get: (c) => c.edge },
];

function ZoomablePhoto({ src, alt, origin, onOrigin }: { src?: string; alt: string; origin: string; onOrigin: (o: string) => void }) {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-full border-2 border-line-strong/60 bg-inset"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onOrigin(`${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}% ${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      }}
      onPointerLeave={() => onOrigin("50% 50%")}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="size-full select-none rounded-full object-cover transition-transform duration-200 ease-out hover:scale-[2.2]"
          style={{ transformOrigin: origin }}
        />
      ) : (
        <div className="flex size-full items-center justify-center font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
          No photo
        </div>
      )}
    </div>
  );
}

function CompareDialog({
  candidate,
  photos,
  open,
  onClose,
  onSelect,
}: {
  candidate: Candidate | null;
  photos: ScanPhotos;
  open: boolean;
  onClose: () => void;
  onSelect: (c: Candidate) => void;
}) {
  const [face, setFace] = useState<"obverse" | "reverse">("obverse");
  const [syncZoom, setSyncZoom] = useState(true);
  const [leftOrigin, setLeftOrigin] = useState("50% 50%");
  const [rightOrigin, setRightOrigin] = useState("50% 50%");

  useEffect(() => {
    if (open) {
      setFace("obverse");
      setLeftOrigin("50% 50%");
      setRightOrigin("50% 50%");
    }
  }, [open, candidate?.coin.id]);

  const coin = candidate?.coin;
  const userSrc = face === "obverse" ? photos.obverse : photos.reverse;
  const refSrc = coin ? (face === "obverse" ? coin.images.obverse : coin.images.reverse) : undefined;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[900px] rounded-[16px] border-line bg-bg-raised p-6 md:p-8">
        <DialogTitle className="font-display text-[22px] font-medium text-ink">Under the loupe</DialogTitle>
        <DialogDescription className="font-serif text-[14px] text-ink-dim">
          Your photograph beside the candidate — hover to zoom; both sides move together when sync is on.
        </DialogDescription>

        {/* face switcher */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-line p-0.5" role="tablist" aria-label="Coin face">
            {(["obverse", "reverse"] as const).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={face === f}
                onClick={() => setFace(f)}
                className={cn(
                  "rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
                  face === f ? "bg-brass text-[#131009]" : "text-ink-dim hover:text-ink",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSyncZoom((s) => !s)}
            aria-pressed={syncZoom}
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-dim transition-colors hover:text-brass"
          >
            Sync zoom {syncZoom ? "✓" : "—"}
          </button>
        </div>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <p className="overline-label mb-3 text-center">Your photo</p>
            <ZoomablePhoto
              src={userSrc}
              alt={`Your ${face}`}
              origin={leftOrigin}
              onOrigin={(o) => {
                setLeftOrigin(o);
                if (syncZoom) setRightOrigin(o);
              }}
            />
          </div>
          <div>
            <p className="overline-label mb-3 text-center">
              Reference{coin ? ` — ${coinTitle(coin)}` : ""}
            </p>
            <ZoomablePhoto
              src={refSrc}
              alt={coin ? `${coinTitle(coin)} ${face}` : "Candidate"}
              origin={rightOrigin}
              onOrigin={(o) => {
                setRightOrigin(o);
                if (syncZoom) setLeftOrigin(o);
              }}
            />
          </div>
        </div>

        {/* key specs with match indicators */}
        {coin && (
          <div className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {COMPARE_FIELDS.map((f) => {
              const value = f.get(coin);
              return (
                <div key={f.label} className="flex items-baseline justify-between gap-3 border-b border-line/50 pb-1.5">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">{f.label}</span>
                  <span className="flex items-center gap-1.5 font-mono text-[13px] text-ink">
                    {value ?? "—"}
                    {value ? (
                      <Check className="size-3.5 text-patina" aria-label="Recorded for this candidate" />
                    ) : (
                      <HelpCircle className="size-3.5 text-copper" aria-label="Not recorded" />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink-dim transition-colors hover:text-ink"
          >
            Back to candidates
          </button>
          <button
            type="button"
            onClick={() => candidate && onSelect(candidate)}
            className="inline-flex items-center gap-2 rounded-md bg-brass px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#131009] transition-colors hover:bg-brass-bright"
          >
            <Check className="size-4" /> Select this coin
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------ candidate card */

function CandidateCard({
  candidate,
  rank,
  selected,
  dimmed,
  onSelect,
  onCompare,
  onDismiss,
}: {
  candidate: Candidate;
  rank: number;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
  onCompare: () => void;
  onDismiss: () => void;
}) {
  const c = candidate.coin;
  const meta = [
    c.catalogRefs[0] ? `${c.catalogRefs[0].system}# ${c.catalogRefs[0].code}` : null,
    c.composition,
    c.weightG != null ? `${c.weightG} g` : null,
    c.diameterMm != null ? `${c.diameterMm} mm` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
      animate={{ opacity: dimmed ? 0.4 : 1 }}
      className={cn(
        "relative mb-4 rounded-[12px] border bg-bg-raised p-6 transition-colors",
        rank === 0 && !selected ? "border-brass/50" : "border-line",
        selected && "border-l-4 border-l-patina",
      )}
    >
      {rank === 0 && (
        <span className="absolute -top-2.5 left-5 rounded-full border border-brass/50 bg-bg px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-brass">
          Best match
        </span>
      )}
      {selected && (
        <span className="absolute -top-2.5 left-5 rounded-full border border-patina/50 bg-bg px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-patina">
          Selected
        </span>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label={`Dismiss ${coinTitle(c)}`}
        className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-bg-inset hover:text-ink"
      >
        <X className="size-3.5" />
      </button>

      <div className="grid grid-cols-[88px_1fr] items-start gap-4 md:grid-cols-[88px_1fr_auto]">
        <CoinImage obverse={c.images.obverse} reverse={c.images.reverse} alt={coinTitle(c)} size={88} />
        <div className="min-w-0">
          <h3 className="font-display text-[20px] font-medium text-ink">{coinTitle(c)}</h3>
          <p className="mt-1 truncate font-mono text-[12px] uppercase tracking-[0.06em] text-ink-dim">{meta}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {candidate.reasons.map((r) => (
              <span
                key={r}
                className="rounded-full border border-patina/40 bg-patina/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-patina"
              >
                {r}
              </span>
            ))}
            {candidate.confidence < LOW_CONFIDENCE_THRESHOLD && (
              <span className="rounded-full border border-copper/40 bg-copper/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-copper">
                Low confidence — review carefully
              </span>
            )}
            <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
              {candidate.source === "collection" ? "Your collection" : "Reference set"}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 md:hidden lg:flex">
            <button
              type="button"
              onClick={onCompare}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-bg-raised px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
            >
              <Columns2 className="size-3.5" /> Compare
            </button>
            <button
              type="button"
              onClick={onSelect}
              className="inline-flex items-center gap-1.5 rounded-md bg-brass px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#131009] transition-colors hover:bg-brass-bright"
            >
              <Check className="size-3.5" /> Select this coin
            </button>
          </div>
        </div>
        <div className="col-span-2 flex items-center gap-3 md:col-span-1 md:w-[140px] md:flex-col md:items-end md:gap-1.5">
          <span className={cn("font-mono text-[28px] font-semibold leading-none", confidenceTone(candidate.confidence))}>
            {candidate.confidence}%
          </span>
          <ConfidenceBar value={candidate.confidence} className="w-[120px]" />
          <span className="overline-label">Confidence</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------ main page */

export default function Identify() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const reviewCoinId = searchParams.get("coin");
  const reviewCoin = useCoin(reviewCoinId ?? undefined);
  const coins = useCoins();

  // Photos arrive via router state (other pages) or the scan-session module.
  const [photos, setPhotos] = useState<ScanPhotos | null>(() => {
    const state = location.state as { images?: ScanPhotos; scan?: ScanPhotos } | null;
    const fromState = state?.images ?? state?.scan;
    if (fromState && (fromState.obverse || fromState.reverse)) return { ...fromState };
    const session = loadScanSession();
    if (session && (session.obverse || session.reverse)) {
      return { obverse: session.obverse, reverse: session.reverse };
    }
    return null;
  });

  // Review mode (?coin=:id) preloads the coin's stored images.
  useEffect(() => {
    if (!photos && reviewCoin && (reviewCoin.images.obverse || reviewCoin.images.reverse)) {
      setPhotos({ obverse: reviewCoin.images.obverse, reverse: reviewCoin.images.reverse });
    }
  }, [photos, reviewCoin]);

  const [phase, setPhase] = useState<"analyzing" | "results">("analyzing");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<SelectedCandidate | null>(null);
  const [compare, setCompare] = useState<Candidate | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [filing, setFiling] = useState(false);

  const hasPhotos = Boolean(photos?.obverse || photos?.reverse);

  /* Run the on-device identification (min ~2.2s of analysing theatre).
     Runs once per photo set — later live-query updates must not wipe
     dismissals/selections. */
  const analyzedFor = useRef<ScanPhotos | null>(null);
  useEffect(() => {
    if (!hasPhotos || coins === undefined || !photos) return;
    if (analyzedFor.current === photos) return;
    analyzedFor.current = photos;
    let cancelled = false;
    const started = Date.now();
    const entries = buildReferenceEntries(buildSeedCoins(), coins);
    const provider = createLocalProvider(entries);
    runIdentification([provider], { obverse: photos.obverse, reverse: photos.reverse })
      .then(async (results) => {
        const wait = Math.max(0, 2200 - (Date.now() - started));
        await new Promise((r) => setTimeout(r, wait));
        if (cancelled) return;
        setCandidates(results);
        setPhase("results");
        if (results.length === 0) {
          toast("No confident automatic match", {
            description: "Try the manual search below — identification is never a dead end.",
          });
          setManualOpen(true);
        }
      })
      .catch(async () => {
        if (cancelled) return;
        setPhase("results");
        setManualOpen(true);
        toast.error("Identification couldn't run", { description: "Manual search is ready below." });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPhotos, coins]);

  /* Search corpus: reference pack + own collection, deduplicated by id. */
  const corpus = useMemo(() => {
    const seeds = buildSeedCoins();
    const seedIds = new Set(seeds.map((s) => s.id));
    return [...seeds, ...(coins ?? []).filter((c) => !seedIds.has(c.id))];
  }, [coins]);

  /* --- filing actions --------------------------------------------------- */

  const filePhotos = photos ?? {};

  const reviewAndFile = () => {
    if (!selected) return;
    clearScanSession();
    navigate("/add", { state: { prefill: buildPrefill(selected, filePhotos) } });
  };

  const fileAsIs = async () => {
    if (!selected || filing) return;
    setFiling(true);
    try {
      const prefill = buildPrefill(selected, filePhotos);
      const saved = await addCoin({
        ...prefill,
        title: prefill.title ?? "Unidentified coin",
        country: prefill.country ?? "Unknown",
        denomination: prefill.denomination ?? "Unknown",
      });
      clearScanSession();
      toast.success(`Catalogued · ${formatAccession(saved.accessionNo)}`, {
        description: `${coinTitle(saved)} — attribution pending review.`,
      });
      navigate(`/coin/${saved.id}`);
    } catch {
      toast.error("Couldn't file the entry", { description: "Please try again." });
      setFiling(false);
    }
  };

  const catalogueByHand = () => {
    clearScanSession();
    navigate("/add", {
      state: { prefill: { images: { obverse: filePhotos.obverse, reverse: filePhotos.reverse } } },
    });
  };

  const saveUnidentified = async () => {
    if (filing) return;
    setFiling(true);
    try {
      const saved = await addCoin({
        title: "Unidentified coin",
        country: "Unknown",
        denomination: "Unknown",
        status: "pending",
        images: { obverse: filePhotos.obverse, reverse: filePhotos.reverse },
        notes: "Filed from the identification bench without a match — identify later from the detail page.",
        tags: ["unidentified"],
      });
      clearScanSession();
      toast.success(`Catalogued · ${formatAccession(saved.accessionNo)}`, {
        description: "Saved as unidentified — you can attribute it later from the detail page.",
      });
      navigate(`/coin/${saved.id}`);
    } catch {
      toast.error("Couldn't save the entry", { description: "Please try again." });
      setFiling(false);
    }
  };

  const selectManual = (coin: Coin) => {
    setSelected({ coin, confidence: null, reasons: ["Chosen by you"], sourceLabel: "Manual pick" });
    setManualOpen(false);
    toast(`${coinTitle(coin)} selected`, { description: "Review and file below — attribution pending review." });
  };

  /* --- render ------------------------------------------------------------ */

  // Review mode still loading the coin.
  if (reviewCoinId && !photos) {
    return (
      <div className="flex items-center justify-center px-6 py-24">
        <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-faint">Loading entry…</p>
      </div>
    );
  }

  // Entry state 2: direct visit, nothing to identify.
  if (!hasPhotos) {
    return (
      <div className="mx-auto max-w-[720px] px-4">
        <EmptyState
          headline="Nothing to identify yet"
          body="Photograph a coin with the guided scanner, or search the reference catalogue by hand. Identification runs entirely in your browser."
          actions={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/scan"
                className="inline-flex items-center gap-2 rounded-md bg-brass px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#131009] transition-colors hover:bg-brass-bright"
              >
                <Camera className="size-4" /> Scan a coin
              </Link>
              <button
                type="button"
                onClick={() => setManualOpen((o) => !o)}
                className="inline-flex items-center gap-2 rounded-md border border-line bg-bg-raised px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
              >
                <Search className="size-4" /> Search the catalogue manually
              </button>
              <Link
                to="/add"
                className="inline-flex items-center gap-2 rounded-md border border-line bg-bg-raised px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
              >
                Catalogue by hand
              </Link>
            </div>
          }
        />
        <AnimatePresence>{manualOpen && <ManualSearchPanel corpus={corpus} onSelect={(coin) => navigate(`/coin/${coin.id}`)} />}</AnimatePresence>
      </div>
    );
  }

  if (phase === "analyzing") {
    return <AnalyzingPanel photos={filePhotos} />;
  }

  const manualSelection =
    selected && !candidates.some((c) => c.coin.id === selected.coin.id) ? selected : null;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 md:px-6">
      {/* review-mode banner */}
      {reviewCoin && (
        <div className="mb-6 flex items-center gap-3 rounded-[10px] border border-copper/40 bg-copper/10 px-4 py-3">
          <Stamp className="size-4 shrink-0 text-copper" aria-hidden />
          <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-copper">
            Re-reviewing attribution for {formatAccession(reviewCoin.accessionNo)} — {coinTitle(reviewCoin)}
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* left rail — your scan */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="h-fit rounded-[12px] border border-line bg-bg-raised p-5 lg:sticky lg:top-24"
        >
          <p className="overline-label">Your scan</p>
          <div className="mt-4 flex justify-center">
            <CoinImage
              obverse={filePhotos.obverse}
              reverse={filePhotos.reverse}
              alt="Your scanned coin"
              size={120}
              flippable={Boolean(filePhotos.reverse)}
            />
          </div>
          <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
            {filePhotos.reverse ? "Obverse + reverse captured" : "Obverse captured"}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              to="/scan"
              className="inline-flex items-center justify-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-dim transition-colors hover:text-ink"
            >
              <Camera className="size-3.5" /> Retake photos
            </Link>
            <Link
              to="/scan"
              className="inline-flex items-center justify-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-dim transition-colors hover:text-ink"
            >
              <ImageUp className="size-3.5" /> Upload different photos
            </Link>
          </div>
        </motion.aside>

        {/* right — ranked candidates */}
        <div>
          <SectionHeader
            overline="IDENTIFICATION"
            title={
              candidates.length > 0
                ? `${candidates.length} candidate${candidates.length === 1 ? "" : "s"} found`
                : "No automatic candidates"
            }
            action={
              <Link
                to="/scan"
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink-dim transition-colors hover:text-brass"
              >
                Rescan
              </Link>
            }
          />
          <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.1em] text-ink-dim">
            Ranked by confidence · Review before filing · Attribution pending review
          </p>

          <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }} className="mt-6">
            {candidates.map((cand, i) => (
              <CandidateCard
                key={cand.coin.id}
                candidate={cand}
                rank={i}
                selected={selected?.coin.id === cand.coin.id}
                dimmed={Boolean(selected) && selected?.coin.id !== cand.coin.id}
                onSelect={() =>
                  setSelected({
                    coin: cand.coin,
                    confidence: cand.confidence,
                    reasons: cand.reasons,
                    sourceLabel: cand.source === "collection" ? "Your collection" : "Reference set",
                  })
                }
                onCompare={() => setCompare(cand)}
                onDismiss={() => {
                  setCandidates((cs) => cs.filter((x) => x.coin.id !== cand.coin.id));
                  if (selected?.coin.id === cand.coin.id) setSelected(null);
                }}
              />
            ))}

            {/* manual selection summary when the pick came from search */}
            {manualSelection && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mb-4 rounded-[12px] border border-patina/50 border-l-4 border-l-patina bg-bg-raised p-6"
              >
                <span className="absolute -top-2.5 left-5 rounded-full border border-patina/50 bg-bg px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-patina">
                  Selected
                </span>
                <div className="flex items-center gap-4">
                  <CoinImage
                    obverse={manualSelection.coin.images.obverse}
                    reverse={manualSelection.coin.images.reverse}
                    alt={coinTitle(manualSelection.coin)}
                    size={64}
                  />
                  <div className="min-w-0">
                    <h3 className="font-display text-[20px] font-medium text-ink">{coinTitle(manualSelection.coin)}</h3>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                      Manual pick · No confidence claimed
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* none-of-these row */}
            <div className="rounded-[12px] border border-dashed border-line-strong p-5">
              <p className="font-serif text-[15.5px] italic text-ink-dim">None of these look right?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setManualOpen((o) => !o)}
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-bg-raised px-3.5 py-2 font-mono text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
                >
                  <Search className="size-3.5" /> Search manually
                </button>
                <button
                  type="button"
                  onClick={catalogueByHand}
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-bg-raised px-3.5 py-2 font-mono text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
                >
                  <ArrowRight className="size-3.5" /> Catalogue by hand
                </button>
                <button
                  type="button"
                  onClick={() => void saveUnidentified()}
                  disabled={filing}
                  className="inline-flex items-center gap-2 rounded-md border border-copper/40 bg-copper/10 px-3.5 py-2 font-mono text-[11.5px] font-medium uppercase tracking-[0.12em] text-copper transition-colors hover:border-copper disabled:opacity-50"
                >
                  <Archive className="size-3.5" /> Save as unidentified
                </button>
              </div>
            </div>

            <AnimatePresence>{manualOpen && <div className="mt-4"><ManualSearchPanel corpus={corpus} onSelect={selectManual} /></div>}</AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* compare dialog */}
      <CompareDialog
        candidate={compare}
        photos={filePhotos}
        open={Boolean(compare)}
        onClose={() => setCompare(null)}
        onSelect={(cand) => {
          setSelected({
            coin: cand.coin,
            confidence: cand.confidence,
            reasons: cand.reasons,
            sourceLabel: cand.source === "collection" ? "Your collection" : "Reference set",
          });
          setCompare(null);
        }}
      />

      {/* bottom action bar */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-[720px] flex-wrap items-center justify-between gap-3 rounded-full border border-line bg-bg-raised/95 px-5 py-3 shadow-lg backdrop-blur lg:bottom-6"
          >
            <span className="truncate font-mono text-[12px] uppercase tracking-[0.1em] text-ink-dim">
              <span className="text-ink">{coinTitle(selected.coin)}</span> selected
              {selected.confidence != null ? ` · ${selected.confidence}%` : ""} · pending review
            </span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fileAsIs()}
                disabled={filing}
                className="rounded-md border border-line bg-bg-raised px-3.5 py-2 font-mono text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong disabled:opacity-50"
              >
                File as-is
              </button>
              <button
                type="button"
                onClick={reviewAndFile}
                className="inline-flex items-center gap-1.5 rounded-md bg-brass px-3.5 py-2 font-mono text-[11.5px] font-medium uppercase tracking-[0.12em] text-[#131009] transition-colors hover:bg-brass-bright"
              >
                <Stamp className="size-3.5" /> Review & file entry
              </button>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
