import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownWideNarrow,
  Check,
  LayoutGrid,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Coin } from "@/types/coin";
import { useCoins, updateCoin, deleteCoin } from "@/hooks/useCoins";
import { fuseSearch } from "@/lib/coin-utils";
import { db } from "@/lib/db";
import { usePaletteOpen } from "@/lib/palette";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import FacetPanel from "@/components/collection/FacetPanel";
import BatchBar from "@/components/collection/BatchBar";
import { EntryCard, EntryRow } from "@/components/collection/EntryCard";
import {
  DEFAULT_FACETS,
  SORT_OPTIONS,
  activeChips,
  activeFilterCount,
  applyFacets,
  applySort,
  facetsToParams,
  parseFacets,
  toggleValue,
  toggleStatus,
} from "@/components/collection/filters";
import type { Facets } from "@/components/collection/filters";
import type { CoinStatus } from "@/types/coin";

const PAGE_SIZE = 48;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ------------------------------ sort menu ------------------------------ */

function SortMenu({ facets, update }: { facets: Facets; update: (p: Partial<Facets>) => void }) {
  const active = SORT_OPTIONS.find((o) => o.id === facets.sort);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 gap-2 border-line bg-bg-raised font-mono text-[12px] uppercase tracking-[0.12em] text-ink hover:border-line-strong"
        >
          <ArrowDownWideNarrow className="size-4 text-ink-dim" />
          <span className="hidden sm:inline">{active?.label ?? "Sort"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-line bg-bg-raised font-mono text-[12px]">
        {SORT_OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.id}
            onClick={() => update({ sort: o.id })}
            className="flex items-center justify-between gap-6 uppercase tracking-[0.08em]"
          >
            {o.label}
            {facets.sort === o.id && <Check className="size-3.5 text-brass" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------------------------- view switcher ---------------------------- */

function ViewSwitcher({ facets, update }: { facets: Facets; update: (p: Partial<Facets>) => void }) {
  return (
    <div className="flex rounded-md border border-line p-1">
      {(
        [
          { id: "grid", icon: LayoutGrid, label: "Grid view" },
          { id: "list", icon: List, label: "List view" },
        ] as const
      ).map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={facets.view === id}
          aria-label={label}
          onClick={() => update({ view: id })}
          className={cn(
            "grid size-7 place-items-center rounded transition-colors",
            facets.view === id ? "bg-brass/15 text-brass" : "text-ink-faint hover:text-ink",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- page -------------------------------- */

export default function Collection() {
  const coins = useCoins();
  const [searchParams, setSearchParams] = useSearchParams();
  const facets = useMemo(() => parseFacets(searchParams), [searchParams]);
  const [paletteOpen] = usePaletteOpen();

  const update = useCallback(
    (patch: Partial<Facets>) => {
      const next = { ...facets, ...patch };
      const typingOnly = Object.keys(patch).length === 1 && "q" in patch;
      setSearchParams(facetsToParams(next), { replace: typingOnly });
    },
    [facets, setSearchParams],
  );

  const clearFilters = useCallback(() => {
    update({ ...DEFAULT_FACETS, q: "", sort: facets.sort, view: facets.view });
  }, [update, facets.sort, facets.view]);

  /* ---- search input (debounced into the URL) ---- */
  const [qInput, setQInput] = useState(facets.q);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (facets.q !== qInput) setQInput(facets.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facets.q]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (qInput !== facets.q) update({ q: qInput });
    }, 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  /* "/" focuses the search field — only when the global palette is closed.
     Document-level stopPropagation keeps the palette's window listener from
     also opening on this page (⌘K still opens it everywhere). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || paletteOpen) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable))
        return;
      e.preventDefault();
      e.stopPropagation();
      searchRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [paletteOpen]);

  /* ---- data pipeline: search → facets → sort ---- */
  const searched = useMemo(
    () => (facets.q.trim() ? fuseSearch(coins ?? [], facets.q) : (coins ?? [])),
    [coins, facets.q],
  );
  const filtered = useMemo(() => applyFacets(searched, facets), [searched, facets]);
  const sorted = useMemo(() => applySort(filtered, facets), [filtered, facets]);
  const navState = useMemo(() => ({ listIds: sorted.map((c) => c.id) }), [sorted]);

  /* ---- infinite scroll ---- */
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchParams]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleCount((n) => {
          if (n >= sorted.length) return n;
          setLoadingMore(true);
          window.setTimeout(() => setLoadingMore(false), 400);
          return Math.min(n + PAGE_SIZE, sorted.length);
        });
      },
      { rootMargin: "600px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [sorted.length]);

  const visible = sorted.slice(0, visibleCount);

  /* ---- batch selection ---- */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!coins) return;
    setSelected((prev) => {
      const ids = new Set(coins.map((c) => c.id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [coins]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectedCoins = useMemo(
    () => (coins ?? []).filter((c) => selected.has(c.id)),
    [coins, selected],
  );

  const handleVerify = async () => {
    const ids = [...selected];
    await Promise.all(ids.map((id) => updateCoin(id, { status: "verified" })));
    setSelected(new Set());
    toast.success(`${ids.length} ${ids.length === 1 ? "entry" : "entries"} marked verified`);
  };

  const handleAddTag = async () => {
    const tag = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (!tag) return;
    await Promise.all(
      selectedCoins.map((c) =>
        updateCoin(c.id, { tags: c.tags.includes(tag) ? c.tags : [...c.tags, tag] }),
      ),
    );
    setTagDialogOpen(false);
    setTagInput("");
    setSelected(new Set());
    toast.success(`#${tag} added to ${selectedCoins.length} ${selectedCoins.length === 1 ? "entry" : "entries"}`);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(selectedCoins, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `numisma-selection-${selectedCoins.length}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedCoins.length} ${selectedCoins.length === 1 ? "entry" : "entries"} as JSON`);
  };

  const handleDelete = async () => {
    const snapshot: Coin[] = selectedCoins.map((c) => ({ ...c }));
    await Promise.all(snapshot.map((c) => deleteCoin(c.id)));
    setDeleteOpen(false);
    setSelected(new Set());
    toast(`${snapshot.length} ${snapshot.length === 1 ? "entry" : "entries"} deleted`, {
      description: "Removed from the catalogue.",
      action: {
        label: "Undo",
        onClick: () => {
          void db.coins.bulkPut(snapshot).then(() => toast.success("Deletion undone"));
        },
      },
    });
  };

  /* ---- active filter chips ---- */
  const chips = activeChips(facets);
  const removeChip = (group: string, value?: string) => {
    switch (group) {
      case "status":
        update({ statuses: toggleStatus(facets.statuses, value as CoinStatus) });
        break;
      case "country":
        update({ countries: toggleValue(facets.countries, value!) });
        break;
      case "decade":
        update({ decades: toggleValue(facets.decades, value!) });
        break;
      case "composition":
        update({ compositions: toggleValue(facets.compositions, value!) });
        break;
      case "denomination":
        update({ denominations: toggleValue(facets.denominations, value!) });
        break;
      case "grade":
        update({ gradeMin: 0 });
        break;
      case "year":
        update({ yearMin: null, yearMax: null });
        break;
      case "tag":
        update({ tags: toggleValue(facets.tags, value!) });
        break;
    }
  };

  const nActive = activeFilterCount(facets);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* ---- loading skeleton ---- */
  if (!coins) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 py-12 md:px-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-10 w-72" />
        <Skeleton className="mt-6 h-12 w-full" />
        <div className="mt-10 grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-[12px] border border-line bg-bg-raised p-5">
              <Skeleton className="mx-auto aspect-square w-full max-w-[170px] rounded-full" />
              <Skeleton className="mt-4 h-3 w-16" />
              <Skeleton className="mt-2 h-5 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- empty collection ---- */
  if (coins.length === 0) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 md:px-6">
        <EmptyState
          headline="Your cabinet is empty"
          body="No coins yet — scan your first piece and NUMISMA will help identify it, or catalogue an entry by hand."
          cta={{ label: "Scan a coin", to: "/scan" }}
          secondaryCta={{ label: "Add entry", to: "/add" }}
          className="py-24"
        />
      </div>
    );
  }

  const controls = (
    <>
      <SortMenu facets={facets} update={update} />
      <ViewSwitcher facets={facets} update={update} />
      <Button
        asChild
        variant="outline"
        className="h-9 border-line bg-bg-raised font-mono text-[12px] uppercase tracking-[0.12em] text-ink hover:border-line-strong"
      >
        <Link to="/add">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Add entry</span>
        </Link>
      </Button>
    </>
  );

  return (
    <div className="mx-auto max-w-[1240px] px-4 md:px-6">
      {/* ---- page header ---- */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="pb-6 pt-12"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-px w-6 bg-brass" />
              <span className="overline-label">The Catalogue</span>
            </div>
            <h1 className="mt-3 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.015em] text-ink md:text-[44px]">
              Collection{" "}
              <span className="font-normal italic text-ink-dim">— {coins.length} entries</span>
            </h1>
          </div>
          <div className="hidden items-center gap-2 lg:flex">{controls}</div>
        </div>

        {/* search bar */}
        <div className="relative mt-6">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <Input
            ref={searchRef}
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQInput("");
            }}
            placeholder="Search title, country, year, catalogue Nº, mint…"
            aria-label="Search the collection"
            className="h-12 rounded-md border-line bg-bg-inset pl-10 pr-20 font-mono text-[14px] placeholder:text-ink-faint focus-visible:border-brass focus-visible:ring-brass/25"
          />
          {qInput ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
            >
              <X className="size-4" />
            </button>
          ) : (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-line bg-bg-raised px-1.5 py-0.5 font-mono text-[11px] text-ink-faint">
              ⌘K
            </span>
          )}
        </div>
      </motion.header>

      {/* ---- toolbar (sticky) ---- */}
      <div className="sticky top-14 z-30 -mx-4 border-b border-line bg-bg/90 px-4 backdrop-blur md:-mx-6 md:px-6 lg:top-16">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="tabular font-mono text-[12px] uppercase tracking-[0.12em] text-ink-dim">
              {sorted.length} of {coins.length}
            </span>
            <AnimatePresence>
              {chips.map((chip) => (
                <motion.button
                  key={`${chip.group}-${chip.value ?? chip.label}`}
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => removeChip(chip.group, chip.value)}
                  className="flex items-center gap-1.5 rounded-full border border-brass/40 bg-brass/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-brass transition-colors hover:border-oxblood/50 hover:text-oxblood"
                >
                  {chip.label}
                  <X className="size-3" />
                </motion.button>
              ))}
            </AnimatePresence>
            {nActive > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint underline-offset-2 hover:text-oxblood hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 lg:hidden">{controls}</div>
        </div>
      </div>

      {/* ---- body: facets + results ---- */}
      <div className="flex gap-10 py-8">
        {/* desktop facet rail */}
        <aside className="sticky top-32 hidden max-h-[calc(100vh-160px)] w-[260px] shrink-0 self-start overflow-auto pr-2 lg:block">
          <FacetPanel searched={searched} value={facets} onChange={update} onClear={clearFilters} />
        </aside>

        <div className="min-w-0 flex-1">
          {sorted.length === 0 ? (
            <EmptyState
              headline="No coins match those filters"
              body="Nothing in the cabinet fits that combination — try widening the year range or clearing a facet or two."
              actions={
                <Button
                  onClick={clearFilters}
                  className="rounded-md bg-brass px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#131009] hover:bg-brass-bright"
                >
                  Clear filters
                </Button>
              }
            />
          ) : facets.view === "grid" ? (
            <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
              <AnimatePresence mode="popLayout">
                {visible.map((coin, i) => (
                  <motion.div
                    key={coin.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.45, ease: EASE, delay: i < 12 ? i * 0.05 : 0 },
                    }}
                  >
                    <EntryCard
                      coin={coin}
                      selected={selected.has(coin.id)}
                      selectionActive={selected.size > 0}
                      onToggleSelect={toggleSelect}
                      navState={navState}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div>
              {/* list column headers */}
              <div className="hidden grid-cols-[72px_2fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-line px-2 pb-2 md:grid">
                <span />
                <HeaderCell label="Entry" onClick={() => update({ sort: "accession" })} active={facets.sort === "accession"} />
                <HeaderCell label="Country" onClick={() => update({ sort: "country" })} active={facets.sort === "country"} />
                <HeaderCell label="Year" onClick={() => update({ sort: "oldest" })} active={facets.sort === "oldest"} />
                <span className="overline-label">Grade</span>
                <HeaderCell label="Value" onClick={() => update({ sort: "value-desc" })} active={facets.sort === "value-desc" || facets.sort === "value-asc"} className="justify-end" />
              </div>
              <AnimatePresence mode="popLayout">
                {visible.map((coin, i) => (
                  <motion.div
                    key={coin.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      transition: { duration: 0.35, ease: EASE, delay: i < 12 ? i * 0.04 : 0 },
                    }}
                  >
                    <EntryRow
                      coin={coin}
                      selected={selected.has(coin.id)}
                      selectionActive={selected.size > 0}
                      onToggleSelect={toggleSelect}
                      navState={navState}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* infinite scroll sentinel + loading skeletons */}
          {visibleCount < sorted.length && (
            <div ref={sentinelRef} className="pt-5">
              <div className="py-2 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                Loading more…
              </div>
              {loadingMore && facets.view === "grid" && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse rounded-[12px] border border-line bg-bg-raised p-5">
                      <div className="mx-auto aspect-square w-full max-w-[170px] rounded-full bg-line/40" />
                      <div className="mt-4 h-3 w-16 rounded bg-line/40" />
                      <div className="mt-2 h-5 w-full rounded bg-line/40" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {visibleCount >= sorted.length && sorted.length > 0 && (
            <div className="flex items-center gap-4 py-10">
              <span aria-hidden className="h-px flex-1 bg-line" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                — End of catalogue · {sorted.length} {sorted.length === 1 ? "entry" : "entries"} —
              </span>
              <span aria-hidden className="h-px flex-1 bg-line" />
            </div>
          )}
        </div>
      </div>

      {/* ---- mobile filters FAB + sheet ---- */}
      <button
        type="button"
        onClick={() => setFiltersOpen(true)}
        className="fixed bottom-24 left-4 z-40 flex items-center gap-2 rounded-full border border-line-strong bg-bg-raised px-4 py-2.5 font-mono text-[12px] uppercase tracking-[0.12em] text-ink shadow-xl lg:hidden"
      >
        <SlidersHorizontal className="size-4 text-brass" />
        Filters
        {nActive > 0 && (
          <span className="tabular grid size-5 place-items-center rounded-full bg-brass font-mono text-[11px] text-[#131009]">
            {nActive}
          </span>
        )}
      </button>
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="flex w-[320px] flex-col border-line bg-bg px-5">
          <SheetHeader>
            <SheetTitle className="font-display text-[20px] text-ink">Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto pb-4">
            <FacetPanel searched={searched} value={facets} onChange={update} onClear={clearFilters} />
          </div>
          <div className="sticky bottom-0 border-t border-line bg-bg py-3">
            <Button
              onClick={() => setFiltersOpen(false)}
              className="w-full rounded-md bg-brass font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#131009] hover:bg-brass-bright"
            >
              Show {sorted.length} {sorted.length === 1 ? "result" : "results"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ---- batch selection ---- */}
      <BatchBar
        count={selected.size}
        onVerify={() => void handleVerify()}
        onAddTag={() => setTagDialogOpen(true)}
        onExport={handleExport}
        onDelete={() => setDeleteOpen(true)}
        onClear={() => setSelected(new Set())}
      />

      {/* add-tag dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="border-line bg-bg-raised">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">Add a tag</DialogTitle>
            <DialogDescription className="font-serif text-[15px] text-ink-dim">
              The tag is added to all {selected.size} selected {selected.size === 1 ? "entry" : "entries"}.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleAddTag();
            }}
            placeholder="e.g. silver, circulation-find…"
            className="border-line bg-bg-inset font-mono text-[14px]"
          />
          <DialogFooter>
            <Button
              onClick={() => void handleAddTag()}
              disabled={!tagInput.trim()}
              className="rounded-md bg-brass font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#131009] hover:bg-brass-bright"
            >
              Add tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-line bg-bg-raised">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-[20px]">
              Delete {selected.size} {selected.size === 1 ? "entry" : "entries"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-serif text-[15px] leading-[1.65] text-ink-dim">
              This removes the selected entries — including their photos, provenance and personal notes —
              from the catalogue. You can undo immediately after deleting.
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

function HeaderCell({
  label,
  onClick,
  active,
  className,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "overline-label flex items-center gap-1 text-left transition-colors hover:text-ink",
        active && "text-brass",
        className,
      )}
    >
      {label}
    </button>
  );
}
