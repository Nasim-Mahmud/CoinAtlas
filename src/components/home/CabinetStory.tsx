import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Camera, ScanSearch, Stamp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Section 3 — The Cabinet (home.md §3): pinned scroll story.
 * Left: cabinet photograph with a scrubbed ken-burns zoom. Right: three
 * "drawer" panels cycling as scroll passes 1/3 and 2/3, with a brass progress
 * rail. Pinned for +180vh. Reduced motion → normal stacked section, no pin.
 *
 * Implemented with CSS `position: sticky` + Framer Motion scroll progress —
 * deliberately NOT GSAP ScrollTrigger pinning, which re-parents DOM nodes
 * (pin-spacer) outside React and corrupts React 19 commits (insertBefore
 * NotFoundError → blank page) whenever a live query re-renders the tree.
 */

/** Prefix a public/ asset with the Vite base URL (GitHub Pages subpath-safe). */
function asset(p: string): string {
  if (!p) return p;
  if (/^(data:|blob:|https?:|mailto:)/i.test(p)) return p;
  const base = import.meta.env.BASE_URL || "/";
  const clean = p.replace(/^\/+/, "");
  return (base.endsWith("/") ? base : base + "/") + clean;
}

interface Drawer {
  icon: LucideIcon;
  marker: string;
  title: string;
  body: string;
}

const DRAWERS: Drawer[] = [
  {
    icon: Camera,
    marker: "Nº 01",
    title: "Photograph both sides.",
    body: "The guided viewfinder aligns the coin and captures obverse and reverse in seconds — or drop in existing photos.",
  },
  {
    icon: ScanSearch,
    marker: "Nº 02",
    title: "Get ranked matches.",
    body: "Candidates arrive with confidence scores. Compare your photo against references and confirm — or correct — the attribution.",
  },
  {
    icon: Stamp,
    marker: "Nº 03",
    title: "File it like a museum.",
    body: "Specs, mintage, catalogue numbers, grade, acquisition, notes — a proper record, stamped with its own accession number.",
  },
];

export default function CabinetStory() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start start", "end end"],
  });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(2, Math.floor(v * 3));
    setActive((prev) => (prev === idx ? prev : idx));
  });

  const content = (
    <div className="mx-auto grid min-h-[100dvh] max-w-[1240px] items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:gap-16 lg:px-6">
      {/* Left — framed cabinet photograph */}
      <div className="relative overflow-hidden rounded-[12px] border border-line">
        <motion.img
          src={asset("/home-cabinet.jpg")}
          alt="Open walnut collector's cabinet drawer with coin trays in warm lamplight"
          className="aspect-[16/10] w-full object-cover will-change-transform lg:aspect-auto lg:h-[68vh]"
          loading="lazy"
          style={reduced ? undefined : { scale: imgScale }}
        />
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[12px] shadow-[inset_0_0_60px_rgba(14,11,7,0.45)]" />
      </div>

      {/* Right — cycling drawer panels + progress rail */}
      <div className="flex gap-6">
        {/* Progress rail */}
        <div className="relative w-px self-stretch bg-line" aria-hidden>
          <motion.div
            className="absolute inset-0 origin-top bg-brass"
            style={reduced ? { scaleY: 1 } : { scaleY: railScale }}
          />
        </div>

        <div className="relative flex-1">
          <span className="overline-label">The cabinet method</span>
          <div className="relative mt-8 lg:min-h-[320px]">
            {DRAWERS.map((d, i) => (
              <div
                key={d.marker}
                aria-hidden={active !== i}
                className={cn(
                  "transition-all duration-500 ease-out lg:absolute lg:inset-0",
                  // mobile / reduced-motion: stacked
                  "mb-10 lg:mb-0",
                  active === i ? "lg:translate-y-0 lg:opacity-100" : "lg:pointer-events-none lg:translate-y-10 lg:opacity-0",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full border border-line bg-bg-inset text-brass">
                    <d.icon className="size-5" aria-hidden />
                  </span>
                  <span className="tabular font-mono text-[12px] tracking-[0.12em] text-ink-faint">{d.marker} / 03</span>
                </div>
                <h3 className="mt-5 font-display text-[28px] font-semibold leading-tight text-ink">{d.title}</h3>
                <p className="mt-3 max-w-[48ch] font-serif text-[16px] leading-[1.65] text-ink-dim">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (reduced) {
    return (
      <section ref={rootRef} className="relative overflow-hidden border-y border-line bg-bg-raised/40">
        {content}
      </section>
    );
  }

  return (
    <section ref={rootRef} className="relative border-y border-line bg-bg-raised/40" style={{ height: "280vh" }}>
      <div className="sticky top-0 overflow-hidden">{content}</div>
    </section>
  );
}
