import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Camera, CircleDollarSign, Plus, Search, Settings } from "lucide-react";
import { usePaletteOpen } from "@/lib/palette";
import { useCoins } from "@/hooks/useCoins";
import { fuseSearch, formatAccession, coinTitle } from "@/lib/coin-utils";
import StatusDot from "@/components/coin/StatusDot";

/**
 * Global ⌘K / Ctrl+K / "/" command palette (design.md §5.3).
 * Fuzzy-searches entries (title, country, year, catalogue ref, accession Nº)
 * plus jump actions. Framer scale/fade 0.15s.
 */
export default function CommandPalette() {
  const [open, setOpen] = usePaletteOpen();
  const [query, setQuery] = useState("");
  const coins = useCoins();
  const navigate = useNavigate();

  // Global hotkeys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    if (!coins) return [];
    return fuseSearch(coins, query).slice(0, 8);
  }, [coins, query]);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const actions = [
    { icon: Camera, label: "Scan a coin", hint: "Guided capture", to: "/scan" },
    { icon: Plus, label: "Add entry", hint: "Catalogue manually", to: "/add" },
    { icon: BarChart3, label: "Go to Stats", hint: "Collection analytics", to: "/stats" },
    { icon: Settings, label: "Go to Settings", hint: "Theme, export, data", to: "/settings" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette-overlay"
          className="fixed inset-0 z-[100] flex items-start justify-center bg-bg/70 px-4 pt-[14vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="w-full max-w-[560px] overflow-hidden rounded-[12px] border border-line bg-bg-raised shadow-brass-glow"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Command shouldFilter={false} label="Search the collection">
              <div className="flex items-center gap-3 border-b border-line px-4">
                <Search className="size-4 shrink-0 text-ink-faint" aria-hidden />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search entries, refs, Nº… or jump somewhere"
                  className="h-12 w-full bg-transparent font-mono text-[14px] text-ink outline-none placeholder:text-ink-faint"
                  autoFocus
                />
                <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">ESC</kbd>
              </div>
              <Command.List className="max-h-[340px] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-8 text-center font-mono text-[12px] text-ink-faint">
                  No entries match “{query}”.
                </Command.Empty>

                {results.length > 0 && (
                  <Command.Group
                    heading="Entries"
                    className="[&_[cmdk-group-heading]]:overline-label [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
                  >
                    {results.map((coin) => (
                      <Command.Item
                        key={coin.id}
                        value={coin.id}
                        onSelect={() => go(`/coin/${coin.id}`)}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 data-[selected=true]:bg-bg-inset"
                      >
                        <CircleDollarSign className="size-4 shrink-0 text-bronze" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-[15px] text-ink">{coinTitle(coin)}</span>
                          <span className="block truncate font-mono text-[11px] text-ink-faint">
                            {formatAccession(coin.accessionNo)}
                            {coin.catalogRefs[0]
                              ? ` · ${coin.catalogRefs[0].system}${coin.catalogRefs[0].system === "RIC" ? "" : "#"} ${coin.catalogRefs[0].code}`
                              : ""}
                          </span>
                        </span>
                        <StatusDot status={coin.status} />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                <Command.Group
                  heading="Actions"
                  className="[&_[cmdk-group-heading]]:overline-label [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
                >
                  {actions.map((a) => (
                    <Command.Item
                      key={a.to}
                      value={`action-${a.to}`}
                      onSelect={() => go(a.to)}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 data-[selected=true]:bg-bg-inset"
                    >
                      <a.icon className="size-4 shrink-0 text-brass" aria-hidden />
                      <span className="flex-1 font-mono text-[13px] text-ink">{a.label}</span>
                      <span className="font-mono text-[11px] text-ink-faint">{a.hint}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
