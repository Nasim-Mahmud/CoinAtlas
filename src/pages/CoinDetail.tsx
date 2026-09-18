import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  ScanSearch,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Coin } from "@/types/coin";
import { addCoin, deleteCoin, useCoins } from "@/hooks/useCoins";
import { formatAccession } from "@/lib/coin-utils";
import {
  formatDate,
  formatDiameter,
  formatMoney,
  formatNumber,
  formatWeight,
} from "@/lib/format";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import SectionHeader from "@/components/SectionHeader";
import EmptyState from "@/components/EmptyState";
import { Reveal, RevealItem } from "@/components/Reveal";
import CoinImage, { SvgMask } from "@/components/coin/CoinImage";
import StatusDot from "@/components/coin/StatusDot";
import GradeBadge from "@/components/coin/GradeBadge";
import CatalogRefChips from "@/components/coin/CatalogRefChips";
import CoinStage from "@/components/detail/CoinStage";
import SpecRecord from "@/components/detail/SpecRecord";
import ProvenancePanel from "@/components/detail/ProvenancePanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function compositionFamily(c: Coin): string | undefined {
  return c.composition?.split(/[ :/.,(]/)[0]?.trim() || undefined;
}

function shareText(c: Coin): string {
  const bits = [
    `${formatAccession(c.accessionNo)} — ${c.title}`,
    [compositionFamily(c), c.weightG != null ? `${c.weightG}g` : null, c.diameterMm != null ? `${c.diameterMm}mm` : null]
      .filter(Boolean)
      .join(", "),
    c.catalogRefs.length ? c.catalogRefs.map((r) => `${r.system}#${r.code}`).join(" ") : null,
    c.grade ?? null,
    c.acquiredDate
      ? `Acquired ${new Date(c.acquiredDate).getFullYear()}${c.acquiredFrom ? ` (${c.acquiredFrom})` : ""}`
      : null,
  ].filter(Boolean);
  return bits.join(" · ");
}

export default function CoinDetail() {
  const { id } = useParams<{ id: string }>();
  const coins = useCoins();
  const location = useLocation();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [zoom, setZoom] = useState<"obverse" | "reverse" | null>(null);

  const coin = useMemo(() => coins?.find((c) => c.id === id), [coins, id]);

  /* prev/next — honours the filtered list handed over from Collection
     (router state `listIds`), falling back to accession order. */
  const { prev, next, total, listIds } = useMemo(() => {
    if (!coins || !coin) return { prev: undefined, next: undefined, total: 0, listIds: undefined as string[] | undefined };
    const stateIds = (location.state as { listIds?: unknown } | null)?.listIds;
    const valid = Array.isArray(stateIds) && stateIds.every((x) => typeof x === "string") && stateIds.includes(coin.id);
    const ids = valid ? (stateIds as string[]) : coins.map((c) => c.id);
    const idx = ids.indexOf(coin.id);
    const byId = new Map(coins.map((c) => [c.id, c]));
    const at = (i: number) => (i >= 0 && i < ids.length ? byId.get(ids[i]) : undefined);
    return {
      prev: at(idx - 1),
      next: at(idx + 1),
      total: ids.length,
      listIds: valid ? (stateIds as string[]) : undefined,
    };
  }, [coins, coin, location.state]);

  if (!coins) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 py-10 md:px-6">
        <Skeleton className="h-4 w-48" />
        <div className="mt-8 grid gap-14 lg:grid-cols-[1fr_1.1fr]">
          <Skeleton className="aspect-square w-full rounded-[16px]" />
          <Skeleton className="h-80 w-full rounded-[12px]" />
        </div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 md:px-6">
        <EmptyState
          headline="This drawer is empty"
          body="This entry has left the cabinet — it may have been deleted, or the link points to a coin that was never catalogued."
          cta={{ label: "Back to collection", to: "/collection" }}
          className="py-24"
        />
      </div>
    );
  }

  const navState = listIds ? { listIds } : undefined;
  const pending = coin.status === "pending";
  const yearOrEra = coin.year != null ? String(coin.year) : coin.era;

  const handleDuplicate = async () => {
    const { id: _id, accessionNo: _a, createdAt: _c, updatedAt: _u, ...rest } = coin;
    const copy = await addCoin({
      ...rest,
      title: `${coin.title} (copy)`,
      status: "draft",
      catalogRefs: coin.catalogRefs.map((r) => ({ ...r })),
      tags: [...coin.tags],
      images: { ...coin.images },
      sources: coin.sources.map((s) => ({ ...s })),
    });
    toast.success(`Duplicated as ${formatAccession(copy.accessionNo)}`, {
      description: "Saved as a draft — adjust the details to tell the two apart.",
      action: { label: "View", onClick: () => navigate(`/coin/${copy.id}`, { state: navState }) },
    });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(coin, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `numisma-${String(coin.accessionNo).padStart(4, "0")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Entry exported as JSON");
  };

  const handleShare = async () => {
    const text = shareText(coin);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Catalogue record copied", { description: text });
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleDelete = async () => {
    const snapshot = { ...coin };
    await deleteCoin(coin.id);
    toast(`${formatAccession(coin.accessionNo)} deleted`, {
      description: coin.title,
      action: {
        label: "Undo",
        onClick: () => {
          void db.coins.put(snapshot).then(() => toast.success("Deletion undone"));
        },
      },
    });
    if (location.key !== "default") navigate(-1);
    else navigate("/collection");
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 md:px-6">
      {/* ---- Section 0: top bar ---- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 pb-4 pt-8"
      >
        <div className="flex items-center gap-4">
          <Link
            to="/collection"
            className="group flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-dim transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Collection
          </Link>
          <span className="tabular font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
            {formatAccession(coin.accessionNo)} of {total || coins.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    asChild={Boolean(prev)}
                    variant="ghost"
                    size="icon"
                    disabled={!prev}
                    aria-label="Previous entry"
                    className="group text-ink-dim hover:text-ink"
                  >
                    {prev ? (
                      <Link to={`/coin/${prev.id}`} state={navState}>
                        <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-[3px]" />
                      </Link>
                    ) : (
                      <ChevronLeft className="size-4" />
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {prev && <TooltipContent>{prev.title}</TooltipContent>}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    asChild={Boolean(next)}
                    variant="ghost"
                    size="icon"
                    disabled={!next}
                    aria-label="Next entry"
                    className="group text-ink-dim hover:text-ink"
                  >
                    {next ? (
                      <Link to={`/coin/${next.id}`} state={navState}>
                        <ChevronRight className="size-4 transition-transform group-hover:translate-x-[3px]" />
                      </Link>
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {next && <TooltipContent>{next.title}</TooltipContent>}
            </Tooltip>
          </TooltipProvider>

          <span aria-hidden className="mx-1 h-5 w-px bg-line" />

          <Button
            asChild
            variant="outline"
            className="h-9 border-line bg-bg-raised font-mono text-[12px] uppercase tracking-[0.12em] text-ink hover:border-line-strong"
          >
            <Link to={`/edit/${coin.id}`}>
              <Pencil className="size-3.5" />
              Edit
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More actions" className="text-ink-dim hover:text-ink">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-line bg-bg-raised font-mono text-[12px]">
              <DropdownMenuItem onClick={() => void handleDuplicate()} className="gap-2 uppercase tracking-[0.08em]">
                <Copy className="size-3.5" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport} className="gap-2 uppercase tracking-[0.08em]">
                <Download className="size-3.5" /> Export JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleShare()} className="gap-2 uppercase tracking-[0.08em]">
                <ExternalLink className="size-3.5" /> Share text
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-line" />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="gap-2 uppercase tracking-[0.08em] text-oxblood focus:text-oxblood"
              >
                <Trash2 className="size-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* pending-review banner */}
      {pending && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-md border border-copper/40 bg-copper/10 px-4 py-3"
        >
          <div className="flex items-center gap-2.5">
            <ScanSearch className="size-4 shrink-0 text-copper" />
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-copper">
              Attribution pending review — confirm or correct the identification.
            </span>
          </div>
          <Link
            to={`/identify?coin=${coin.id}`}
            className="rounded-md border border-copper/50 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-copper transition-colors hover:bg-copper/10"
          >
            Review
          </Link>
        </motion.div>
      )}

      {/* ---- Section 1: hero ---- */}
      <div className="grid gap-14 py-10 lg:grid-cols-[1fr_1.1fr]">
        <CoinStage coin={coin} />

        {/* museum plaque */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="relative self-start rounded-[12px] border border-line bg-bg-raised p-6 sm:p-8"
        >
          {/* brass-framed wall-label double border */}
          <span aria-hidden className="pointer-events-none absolute inset-1.5 rounded-[9px] border border-line/60" />

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}>
            <div className="flex items-center justify-between gap-3">
              <span className="tabular font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                {formatAccession(coin.accessionNo)} · Catalogued {formatDate(coin.createdAt)}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
                  coin.status === "verified"
                    ? "border-patina/40 bg-patina/10"
                    : coin.status === "pending"
                      ? "border-copper/40 bg-copper/10"
                      : "border-line",
                )}
              >
                <StatusDot status={coin.status} label />
              </span>
            </div>
            {pending && (
              <button
                type="button"
                onClick={() => document.getElementById("provenance")?.scrollIntoView({ behavior: "smooth" })}
                className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-copper hover:underline"
              >
                Review attribution →
              </button>
            )}
          </motion.div>

          <motion.h1
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
            className="mt-4 font-display text-[28px] font-semibold leading-tight tracking-[-0.015em] text-ink sm:text-[34px]"
          >
            {coin.denomination}
            <span className="mt-1 block font-display text-[18px] font-medium italic text-ink-dim sm:text-[20px]">
              {coin.country}
              {yearOrEra ? ` · ${yearOrEra}` : ""}
              {coin.mint ? ` · ${coin.mint}${/mint/i.test(coin.mint) ? "" : " Mint"}` : ""}
            </span>
          </motion.h1>

          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } }}
            className="my-5 flex items-center gap-3"
            aria-hidden
          >
            <span className="h-px flex-1 bg-line" />
            <span className="text-[10px] text-bronze">◇</span>
            <span className="h-px flex-1 bg-line" />
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { label: "Composition", value: compositionFamily(coin) },
              { label: "Weight", value: coin.weightG != null ? formatWeight(coin.weightG) : undefined },
              { label: "Diameter", value: coin.diameterMm != null ? formatDiameter(coin.diameterMm) : undefined },
            ].map((f) => (
              <div key={f.label}>
                <div className="overline-label text-[10px]">{f.label}</div>
                <div className="mt-1 font-mono text-[14px] text-brass">{f.value ?? "—"}</div>
              </div>
            ))}
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
            className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2"
          >
            {coin.grade && <GradeBadge grade={coin.grade} />}
            {coin.mintage != null && (
              <span className="tabular font-mono text-[12px] text-ink-dim">
                Mintage {formatNumber(coin.mintage)}
              </span>
            )}
            <CatalogRefChips refs={coin.catalogRefs} />
          </motion.div>
        </motion.div>
      </div>

      {/* ---- Section 2: specification plaque ---- */}
      <section className="border-t border-line py-14">
        <SectionHeader overline="Catalogue Record" title="Specifications" className="mb-8" />
        <SpecRecord coin={coin} />
      </section>

      {/* ---- Section 3: obverse & reverse ---- */}
      <section className="border-t border-line py-14">
        <SectionHeader overline="The Faces" title="Obverse & Reverse" className="mb-8" />
        <Reveal className="grid gap-10 md:grid-cols-2" stagger={0.12}>
          {(
            [
              { side: "obverse" as const, desc: coin.obverseDesc, src: coin.images.obverse },
              { side: "reverse" as const, desc: coin.reverseDesc, src: coin.images.reverse },
            ]
          ).map(({ side, desc, src }) => (
            <RevealItem key={side}>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => src && setZoom(side)}
                  aria-label={`Zoom ${side}`}
                  className="group relative size-[100px] shrink-0 sm:size-[140px]"
                >
                  <CoinImage obverse={src} alt={`${coin.title} — ${side}`} size={128} flippable={false} reedRing={false} />
                </button>
                <div className="flex flex-1 items-center gap-3">
                  <span className="overline-label">{side}</span>
                  <span aria-hidden className="h-px flex-1 bg-line" />
                </div>
              </div>
              {desc ? (
                <p className="mt-4 max-w-[62ch] font-serif text-[16.5px] leading-[1.7] text-ink">{desc}</p>
              ) : (
                <div className="mt-4 rounded-[10px] border border-dashed border-line bg-inset p-5">
                  <p className="font-serif text-[15.5px] italic text-ink-faint">No description yet</p>
                  <Link
                    to={`/edit/${coin.id}#descriptions`}
                    className="mt-1 inline-block font-mono text-[12px] uppercase tracking-[0.12em] text-brass hover:underline"
                  >
                    Write one →
                  </Link>
                </div>
              )}
            </RevealItem>
          ))}
        </Reveal>
      </section>

      {/* ---- Section 4: in my collection ---- */}
      <section className="border-t border-line py-14">
        <SectionHeader overline="Provenance & Care" title="In my collection" className="mb-8" />
        <Reveal>
          <RevealItem>
            <div className="rounded-[12px] border border-line border-t-patina/40 bg-bg-raised p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                <div>
                  <div className="overline-label">Grade</div>
                  <div className="mt-2">{coin.grade ? <GradeBadge grade={coin.grade} /> : <span className="font-mono text-[14px] text-ink-faint">—</span>}</div>
                  <div className="mt-1.5 font-mono text-[11px] text-ink-faint">Sheldon scale</div>
                </div>
                <div>
                  <div className="overline-label">Acquired</div>
                  <div className="tabular mt-2 font-mono text-[14px] text-ink">
                    {coin.acquiredDate ? formatDate(coin.acquiredDate) : "—"}
                  </div>
                  {coin.acquiredFrom && <div className="mt-1.5 font-mono text-[11px] text-ink-faint">from: {coin.acquiredFrom}</div>}
                </div>
                <div>
                  <div className="overline-label">Price Paid</div>
                  <div className="tabular mt-2 font-mono text-[14px] text-ink">
                    {coin.pricePaid != null ? formatMoney(coin.pricePaid, coin.currency ?? "USD") : "—"}
                  </div>
                  {coin.estimatedValue != null && (
                    <div className="mt-1.5 font-mono text-[11px] text-ink-faint">
                      est. value {formatMoney(coin.estimatedValue, coin.currency ?? "USD")}
                      {coin.pricePaid != null && coin.pricePaid > 0 && coin.estimatedValue > coin.pricePaid && (
                        <span className="ml-1.5 text-patina">
                          +{Math.round(((coin.estimatedValue - coin.pricePaid) / coin.pricePaid) * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <div className="overline-label">Storage</div>
                  <div className="mt-2 font-mono text-[14px] text-ink">{coin.storageLocation ?? "—"}</div>
                </div>
              </div>

              {coin.notes && (
                <blockquote className="mt-7 border-l-2 border-brass pl-4 font-serif text-[17px] italic leading-[1.65] text-ink-dim">
                  {coin.notes}
                </blockquote>
              )}

              {coin.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {coin.tags.map((t) => (
                    <Link
                      key={t}
                      to={`/collection?tag=${encodeURIComponent(t)}`}
                      className="rounded-full border border-brass/40 bg-brass/10 px-2.5 py-1 font-mono text-[11px] text-brass transition-colors hover:border-brass hover:bg-brass/20"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </RevealItem>
        </Reveal>
      </section>

      {/* ---- Section 5: identification provenance ---- */}
      <section id="provenance" className="scroll-mt-24 border-t border-line py-14">
        <SectionHeader overline="Attribution" title="How this was identified" className="mb-8" />
        <ProvenancePanel coin={coin} />
      </section>

      {/* ---- Section 6: sources ---- */}
      <section className="border-t border-line py-14">
        <SectionHeader overline="Further Reading" title="Sources" className="mb-8" />
        <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08} y={16}>
          {coin.sources.map((s) => (
            <RevealItem key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-[10px] border border-line bg-bg-raised p-4 transition-colors hover:border-line-strong"
              >
                <ExternalLink className="mt-0.5 size-4 shrink-0 text-ink-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brass" />
                <span className="min-w-0">
                  <span className="block truncate font-display text-[16px] font-medium text-ink">{s.label}</span>
                  <span className="mt-0.5 block truncate font-mono text-[12px] text-ink-faint">
                    {(() => {
                      try {
                        return new URL(s.url).host;
                      } catch {
                        return s.url;
                      }
                    })()}
                  </span>
                </span>
              </a>
            </RevealItem>
          ))}
          <RevealItem>
            <Link
              to={`/edit/${coin.id}#sources`}
              className="flex h-full min-h-[68px] items-center justify-center gap-2 rounded-[10px] border border-dashed border-line p-4 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-faint transition-colors hover:border-line-strong hover:text-ink"
            >
              <Plus className="size-4" />
              Add source
            </Link>
          </RevealItem>
        </Reveal>
      </section>

      {/* ---- Section 7: prev / next footer ---- */}
      <nav aria-label="Browse entries" className="border-t border-line py-16">
        <Reveal className="grid gap-4 sm:grid-cols-2">
          <RevealItem>
            {prev ? (
              <NeighborCard coin={prev} dir="prev" navState={navState} />
            ) : (
              <div className="hidden sm:block" />
            )}
          </RevealItem>
          <RevealItem>{next && <NeighborCard coin={next} dir="next" navState={navState} />}</RevealItem>
        </Reveal>
      </nav>

      {/* rubbing-card lightbox */}
      <Dialog open={zoom != null} onOpenChange={(o) => !o && setZoom(null)}>
        <DialogContent className="max-w-[92vw] border-line bg-bg-inset sm:max-w-[600px]">
          <DialogTitle className="font-mono text-[12px] uppercase tracking-[0.18em] text-ink-faint">
            {coin.title} — {zoom}
          </DialogTitle>
          {zoom && (
            <img
              src={zoom === "obverse" ? coin.images.obverse : coin.images.reverse}
              alt={`${coin.title} — ${zoom}`}
              className="mx-auto aspect-square w-full max-w-[480px] rounded-full object-cover"
              draggable={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-line bg-bg-raised">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-[20px]">
              Delete {formatAccession(coin.accessionNo)}?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-serif text-[15px] leading-[1.65] text-ink-dim">
              “{coin.title}” will be removed from the catalogue along with its photographs, provenance
              and personal notes. You can undo immediately after deleting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-line bg-bg-raised font-mono text-[12px] uppercase tracking-[0.12em]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-oxblood font-mono text-[12px] uppercase tracking-[0.12em] text-white hover:bg-oxblood/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------- prev / next footer card ------------------------- */

function NeighborCard({
  coin,
  dir,
  navState,
}: {
  coin: Coin;
  dir: "prev" | "next";
  navState?: { listIds: string[] };
}) {
  const prev = dir === "prev";
  return (
    <Link
      to={`/coin/${coin.id}`}
      state={navState}
      className={cn(
        "group flex items-center gap-4 rounded-[12px] border border-line bg-bg-raised p-5 transition-colors hover:border-line-strong",
        prev ? "" : "flex-row-reverse text-right",
      )}
    >
      <CoinImage
        obverse={coin.images.obverse}
        reverse={coin.images.reverse}
        alt={coin.title}
        size={64}
        reedRing={false}
      />
      <div className="min-w-0 flex-1">
        <div className="overline-label">
          {prev ? "Previous" : "Next"} · {formatAccession(coin.accessionNo)}
        </div>
        <div
          className={cn(
            "mt-1 truncate font-display text-[20px] font-medium text-ink transition-transform",
            prev ? "group-hover:-translate-x-1.5" : "group-hover:translate-x-1.5",
          )}
        >
          {coin.title}
        </div>
      </div>
      {prev ? (
        <ChevronLeft className="size-5 shrink-0 text-ink-faint transition-transform group-hover:-translate-x-0.5 group-hover:text-brass" />
      ) : (
        <ChevronRight className="size-5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brass" />
      )}
    </Link>
  );
}

/* keep SvgMask referenced for potential placeholders (tree-shaken otherwise) */
void SvgMask;
