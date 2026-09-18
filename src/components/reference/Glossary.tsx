import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { GlossaryTerm } from "@/components/reference/content";
import { Highlight } from "@/components/reference/Highlight";

/**
 * Section 5 — Glossary (reference.md): alphabet quick-jump (sticky), term
 * list grouped by letter with mono terms and serif definitions. The header
 * search narrows the list; jump-click scrolls and flashes the letter brass.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Glossary({ terms, query }: { terms: GlossaryTerm[]; query: string }) {
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, GlossaryTerm[]>();
    for (const t of terms) {
      const letter = t.term[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(t);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [terms]);

  const available = useMemo(() => new Set(groups.map(([l]) => l)), [groups]);

  const jump = (letter: string) => {
    const el = document.getElementById(`glossary-${letter}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash(letter);
    flashTimer.current = setTimeout(() => setFlash(null), 1200);
  };

  if (terms.length === 0) {
    return (
      <p className="py-8 text-center font-serif text-[15px] italic text-ink-faint">
        No glossary terms match “{query}”.
      </p>
    );
  }

  return (
    <div>
      {/* Alphabet quick-jump */}
      <nav aria-label="Glossary letters" className="sticky top-16 z-10 -mx-2 mb-4 flex flex-wrap gap-0.5 bg-bg/90 px-2 py-2 backdrop-blur">
        {ALPHABET.map((letter) => {
          const on = available.has(letter);
          return (
            <button
              key={letter}
              type="button"
              disabled={!on}
              onClick={() => jump(letter)}
              className={cn(
                "size-7 rounded-sm font-mono text-[12px] transition-colors",
                on ? "text-ink-dim hover:bg-bg-raised hover:text-brass" : "cursor-default text-ink-faint/40",
              )}
            >
              {letter}
            </button>
          );
        })}
      </nav>

      <div className="space-y-8">
        {groups.map(([letter, letterTerms]) => (
          <div key={letter} id={`glossary-${letter}`} className="scroll-mt-28">
            <h3
              className={cn(
                "font-display text-[24px] font-semibold transition-colors duration-500",
                flash === letter ? "text-brass" : "text-ink",
              )}
            >
              {letter}
            </h3>
            <div className="mt-2 border-t border-line">
              {letterTerms.map((t) => (
                <div
                  key={t.term}
                  className="group grid grid-cols-1 gap-0.5 border-b border-line/50 py-3 sm:grid-cols-[200px_1fr] sm:items-baseline sm:gap-4"
                >
                  <dt className="font-mono text-[13px] font-medium text-ink transition-colors group-hover:text-brass">
                    <Highlight text={t.term} query={query} />
                  </dt>
                  <dd className="font-serif text-[15px] leading-[1.6] text-ink-dim">
                    <Highlight text={t.definition} query={query} />
                  </dd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
