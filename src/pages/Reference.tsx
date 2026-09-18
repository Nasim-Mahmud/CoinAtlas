import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, ExternalLink, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, RevealItem } from "@/components/Reveal";
import Grading from "@/components/reference/Grading";
import Anatomy from "@/components/reference/Anatomy";
import ShapesEdges from "@/components/reference/ShapesEdges";
import Glossary from "@/components/reference/Glossary";
import { Highlight, matchesQuery } from "@/components/reference/Highlight";
import {
  GLOSSARY,
  MINT_MARKS,
  CATALOGUE_SYSTEMS,
  ABBREVIATIONS,
  GRADING_BANDS,
  ANATOMY_TERMS,
  SHAPES,
  EDGES,
} from "@/components/reference/content";

/**
 * /reference — the built-in numismatic reading room (reference.md).
 * Bundled content, searchable client-side, zero network.
 */

const SECTIONS = [
  { id: "grading", label: "Grading" },
  { id: "anatomy", label: "Anatomy" },
  { id: "shapes-edges", label: "Shapes & edges" },
  { id: "mint-marks", label: "Mint marks" },
  { id: "glossary", label: "Glossary" },
  { id: "abbreviations", label: "Abbreviations" },
] as const;

const SECTION_IDS = SECTIONS.map((s) => s.id);

/** Scrollspy over the section ids. */
function useScrollspy(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

function SectionHeading({ overline, title }: { overline: string; title: string }) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-3">
        <span aria-hidden className="h-px w-6 bg-brass" />
        <span className="overline-label">{overline}</span>
      </div>
      <h2 className="mt-3 font-display text-[24px] font-semibold tracking-[-0.015em] text-ink md:text-[30px]">{title}</h2>
    </div>
  );
}

export default function Reference() {
  const location = useLocation();
  const [query, setQuery] = useState("");
  const active = useScrollspy(SECTION_IDS);

  // Deep links (/reference#grading) — used by the Add/Edit grade field.
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }, [location.hash]);

  const glossaryTerms = useMemo(
    () => GLOSSARY.filter((t) => matchesQuery(query, t.term, t.definition)),
    [query],
  );
  const mintGroups = useMemo(
    () => MINT_MARKS.filter((g) => matchesQuery(query, g.country, g.marks)),
    [query],
  );
  const systems = useMemo(
    () => CATALOGUE_SYSTEMS.filter((s) => matchesQuery(query, s.code, s.name, s.description)),
    [query],
  );
  const abbrevs = useMemo(
    () => ABBREVIATIONS.filter((a) => matchesQuery(query, a.code, a.meaning)),
    [query],
  );

  const matchCount = useMemo(() => {
    if (!query.trim()) return 0;
    let n = glossaryTerms.length + mintGroups.length + systems.length + abbrevs.length;
    n += GRADING_BANDS.filter((b) => matchesQuery(query, b.code, b.name, b.description)).length;
    n += ANATOMY_TERMS.filter((t) => matchesQuery(query, t.term, t.definition)).length;
    n += SHAPES.filter((s) => matchesQuery(query, s.name, s.note)).length;
    n += EDGES.filter((e) => matchesQuery(query, e.name, e.note)).length;
    return n;
  }, [query, glossaryTerms, mintGroups, systems, abbrevs]);

  const nav = (className?: string) => (
    <nav aria-label="Reference sections" className={className}>
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className={cn(
            "whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
            active === s.id ? "bg-brass/10 text-brass" : "text-ink-faint hover:text-ink",
          )}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );

  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-12 pb-20 md:px-6">
      {/* Header */}
      <Reveal>
        <RevealItem>
          <div className="pb-8">
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-px w-6 bg-brass" />
              <span className="overline-label">The reading room</span>
            </div>
            <h1 className="mt-3 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.015em] text-ink md:text-[40px]">
              Numismatic reference
            </h1>
            <p className="mt-2 max-w-[60ch] font-serif text-[16px] leading-[1.65] text-ink-dim">
              The essentials for describing, grading, and attributing coins — always available,
              fully offline.
            </p>
            <div className="mt-6 flex max-w-[520px] items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search this library — try “exergue” or “mint mark”"
                  aria-label="Search the reference library"
                  className="h-10 w-full rounded-md border border-line bg-bg-inset pl-9 pr-9 font-mono text-[13px] text-ink placeholder:text-ink-faint focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/25"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
              {query.trim() && (
                <span className="tabular shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-brass">
                  {matchCount} {matchCount === 1 ? "match" : "matches"}
                </span>
              )}
            </div>
          </div>
        </RevealItem>
      </Reveal>

      {/* Mobile pill nav */}
      <div className="mb-8 overflow-x-auto pb-1 lg:hidden">{nav("flex gap-1")}</div>

      {/* Shell: sticky anchor nav + sections */}
      <div className="grid gap-14 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            {nav("flex flex-col items-start gap-1")}
            <div className="mt-8 flex items-center gap-2 border-t border-line/50 pt-4 text-ink-faint">
              <BookOpen className="size-3.5" aria-hidden />
              <span className="font-mono text-[10px] uppercase tracking-[0.12em]">Bundled · offline</span>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-20">
          <section id="grading" className="scroll-mt-24">
            <SectionHeading overline="Condition" title="Grading & condition" />
            <Grading query={query} />
          </section>

          <section id="anatomy" className="scroll-mt-24">
            <SectionHeading overline="The coin, named" title="Anatomy of a coin" />
            <Anatomy query={query} />
          </section>

          <section id="shapes-edges" className="scroll-mt-24">
            <SectionHeading overline="Forms" title="Shapes & edges" />
            <ShapesEdges query={query} />
          </section>

          <section id="mint-marks" className="scroll-mt-24">
            <SectionHeading overline="Where it was struck" title="Common mint marks" />
            {mintGroups.length === 0 ? (
              <p className="font-serif text-[15px] italic text-ink-faint">No mint mark groups match “{query}”.</p>
            ) : (
              <div className="grid gap-x-10 md:grid-cols-2">
                {mintGroups.map((g) => (
                  <div key={g.country} className="border-b border-line/50 py-3.5">
                    <p className="font-mono text-[13px] font-medium uppercase tracking-[0.08em] text-ink">
                      <Highlight text={g.country} query={query} />
                    </p>
                    <p className="mt-1 font-mono text-[12.5px] leading-[1.6] text-ink-dim">
                      <Highlight text={g.marks} query={query} />
                    </p>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-5 max-w-[68ch] font-serif text-[15px] leading-[1.65] text-ink-dim">
              Mint marks are small but decisive — record them in the Mint mark field; they often
              change value dramatically.
            </p>
          </section>

          <section id="glossary" className="scroll-mt-24">
            <SectionHeading overline="A–Z" title="Glossary" />
            <Glossary terms={glossaryTerms} query={query} />
          </section>

          <section id="abbreviations" className="scroll-mt-24">
            <SectionHeading overline="Catalogue language" title="Catalogue references & abbreviations" />
            <div className="grid gap-4 md:grid-cols-2">
              {systems.map((s) => (
                <div key={s.code} className="card-hover rounded-[10px] border border-line bg-bg-raised p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center rounded-full border border-brass/40 bg-brass/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-brass">
                      <Highlight text={s.code} query={query} />
                    </span>
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-faint transition-colors hover:text-brass"
                      >
                        Visit <ExternalLink className="size-3" aria-hidden />
                      </a>
                    )}
                  </div>
                  <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.06em] text-ink-dim">
                    <Highlight text={s.name} query={query} />
                  </p>
                  <p className="mt-1.5 font-serif text-[14.5px] leading-[1.6] text-ink-dim">
                    <Highlight text={s.description} query={query} />
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {abbrevs.map((a) => (
                <span
                  key={a.code}
                  title={a.meaning}
                  className="inline-flex items-baseline gap-2 rounded-full border border-line bg-bg-inset px-3 py-1.5"
                >
                  <span className="font-mono text-[11.5px] font-semibold text-brass">
                    <Highlight text={a.code} query={query} />
                  </span>
                  <span className="font-serif text-[13px] text-ink-dim">
                    <Highlight text={a.meaning} query={query} />
                  </span>
                </span>
              ))}
            </div>
          </section>

          {/* Footer CTA */}
          <div className="border-t border-line pt-12 text-center">
            <p className="font-serif text-[18px] italic text-ink-dim">Learned something? Put it to use.</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/add"
                className="rounded-md bg-brass px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#131009] transition-colors hover:bg-brass-bright"
              >
                Catalogue a coin
              </Link>
              <Link
                to="/scan"
                className="rounded-md border border-line bg-bg-raised px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
              >
                Scan a coin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
