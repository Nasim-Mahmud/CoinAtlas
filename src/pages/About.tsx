import { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";
import { Camera, Check, Lock, ScanSearch, Stamp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal, RevealItem } from "@/components/Reveal";
import { SvgMask } from "@/components/coin/CoinImage";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * /about — the colophon page (about.md): what Numisma is, how identification
 * works, the privacy promise, and the stack. GSAP is isolated to the hero
 * (one mild scroll-zoom, no pin); everything else uses Framer Motion.
 */

/* ------------------------------- Hero (GSAP) ------------------------------ */

function AboutHero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!reduced) {
        // Slow zoom 1.0 → 1.05, scrubbed on scroll (about.md §1).
        gsap.fromTo(
          imgRef.current,
          { scale: 1 },
          {
            scale: 1.05,
            ease: "none",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }

      // Card rise + heading word stagger.
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        "[data-hero-card]",
        { y: reduced ? 0 : 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
      ).fromTo(
        "[data-hero-word]",
        { y: reduced ? 0 : 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.05 },
        "-=0.35",
      );
    },
    { scope: rootRef },
  );

  const words = "A cabinet of curiosities, kept properly.".split(" ");

  return (
    <div ref={rootRef}>
      {/* Image band */}
      <div className="relative h-[46vh] min-h-[320px] overflow-hidden">
        <img
          ref={imgRef}
          src="/about-desk.jpg"
          alt="A collector's workbench — album, cotton gloves, magnifier, caliper, and loose coins on dark felt"
          className="absolute inset-0 size-full object-cover will-change-transform"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgb(var(--bg)) 0%, rgba(19,16,9,0.55) 30%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "url(/guilloche-pattern.svg)", backgroundSize: "480px 480px" }}
        />
      </div>

      {/* Overlapping card */}
      <div
        data-hero-card
        className="relative z-10 mx-auto -mt-24 max-w-[820px] rounded-[16px] border border-line bg-bg-raised p-8 text-center md:p-10"
      >
        <div className="flex items-center justify-center gap-3">
          <span aria-hidden className="h-px w-6 bg-brass" />
          <span className="overline-label">About Numisma</span>
          <span aria-hidden className="h-px w-6 bg-brass" />
        </div>
        <h1 className="mt-4 font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.015em] text-ink md:text-[40px]">
          {words.map((w, i) => (
            <span key={i} data-hero-word className="inline-block will-change-transform">
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </h1>
        <p className="mx-auto mt-4 max-w-[56ch] font-serif text-[17px] leading-[1.65] text-ink-dim">
          Numisma is a personal numismatic catalogue. It helps you photograph, identify, and
          document the coins you physically own — with the care of a museum registrar and the
          privacy of a locked drawer.
        </p>
      </div>
    </div>
  );
}

/* ----------------------------- Why it exists ------------------------------ */

function WhyItExists() {
  return (
    <section className="mx-auto max-w-[760px] px-4 py-16 md:px-6">
      <Reveal>
        <RevealItem>
          <p className="font-serif text-[17px] leading-[1.75] text-ink-dim">
            <span aria-hidden className="float-left mr-3 mt-1 font-display text-[60px] font-semibold leading-[0.8] text-brass">
              S
            </span>
            hoeboxes and albums are wonderful, but they can't be searched. A spreadsheet can be
            searched, but it has no soul. Numisma is the middle ground: the rigour of a catalogue
            raisonné with the warmth of an album — every coin an entry with an accession number,
            provenance, and its own page.
          </p>
        </RevealItem>
        <RevealItem>
          <p className="mt-6 font-serif text-[17px] leading-[1.75] text-ink-dim">
            The metadata philosophy is unapologetically thorough, in the tradition of the great
            public catalogues: a coin is more than a photo. It is composition and mintage, engraver
            and mint mark, die axis and edge lettering — the small facts that turn "an old coin"
            into "Mexico 8 Reales, 1894, Zacatecas mint".
          </p>
        </RevealItem>
        <RevealItem>
          <figure className="my-12 text-center">
            <motion.span
              aria-hidden
              className="mx-auto block h-px w-full max-w-[320px] origin-center bg-line"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6 }}
            />
            <blockquote className="py-8 font-display text-[24px] font-medium italic leading-snug text-ink">
              <span className="text-brass">“</span>Catalogued, not just kept.<span className="text-brass">”</span>
            </blockquote>
            <motion.span
              aria-hidden
              className="mx-auto block h-px w-full max-w-[320px] origin-center bg-line"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6 }}
            />
          </figure>
        </RevealItem>
      </Reveal>
    </section>
  );
}

/* -------------------------- How identification works ----------------------- */

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: Camera,
    title: "Capture",
    body: "Your photos never leave the device. They're analyzed locally for shape, edge, and visual features.",
  },
  {
    icon: ScanSearch,
    title: "Match",
    body: "An on-device reference pack (built from open numismatic data) is ranked against your scan. An optional free Numista key adds live results.",
  },
  {
    icon: Stamp,
    title: "Decide",
    body: "Candidates come with honest confidence scores. You always make the final attribution — nothing is filed without your confirmation.",
  },
];

function HowIdentification() {
  return (
    <section className="mx-auto max-w-[1000px] px-4 py-16 md:px-6">
      <Reveal>
        <RevealItem>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <span aria-hidden className="h-px w-6 bg-brass" />
              <span className="overline-label">Under the loupe</span>
              <span aria-hidden className="h-px w-6 bg-brass" />
            </div>
            <h2 className="mt-3 font-display text-[24px] font-semibold tracking-[-0.015em] text-ink md:text-[30px]">
              How identification works
            </h2>
          </div>
        </RevealItem>
      </Reveal>
      <Reveal stagger={0.12} className="relative mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
        {/* dashed connectors (desktop) */}
        <svg aria-hidden className="absolute left-0 right-0 top-10 hidden h-2 w-full md:block" preserveAspectRatio="none" viewBox="0 0 100 2">
          <motion.line
            x1="20"
            y1="1"
            x2="80"
            y2="1"
            stroke="currentColor"
            className="text-line-strong"
            strokeWidth="0.4"
            strokeDasharray="2 2"
            animate={{ strokeDashoffset: [0, -4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </svg>
        {STEPS.map((step) => (
          <RevealItem key={step.title} className="relative">
            <div className="card-hover h-full rounded-[12px] border border-line bg-bg-raised p-6 text-center">
              <div className="relative mx-auto size-20">
                <SvgMask src="/reed-ring.svg" className="absolute inset-0 text-bronze/70" />
                <span className="absolute inset-3 flex items-center justify-center rounded-full border border-line bg-bg-inset">
                  <step.icon className="size-6 text-brass" aria-hidden />
                </span>
              </div>
              <h3 className="mt-4 font-display text-[19px] font-medium text-ink">{step.title}</h3>
              <p className="mt-2 font-serif text-[15px] leading-[1.65] text-ink-dim">{step.body}</p>
            </div>
          </RevealItem>
        ))}
      </Reveal>
      <p className="mt-8 text-center font-mono text-[12px] uppercase tracking-[0.14em] text-ink-faint">
        No accounts · No uploads · No tracking · No paid services
      </p>
    </section>
  );
}

/* ------------------------------ Privacy panel ------------------------------ */

const ASSURANCES = [
  "Works offline after first load",
  "Export / import anytime (JSON)",
  "Open format — no lock-in",
];

function Privacy() {
  return (
    <section className="mx-auto max-w-[860px] px-4 py-16 md:px-6">
      <Reveal>
        <RevealItem>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[16px] border border-line bg-bg-inset p-8 md:p-10"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full border border-patina/40 bg-patina/10">
                <Lock className="size-4.5 text-patina" aria-hidden />
              </span>
              <h2 className="font-display text-[24px] font-semibold tracking-[-0.01em] text-ink">
                Your collection is yours alone
              </h2>
            </div>
            <p className="mt-4 font-serif text-[16.5px] leading-[1.7] text-ink-dim">
              Every entry, photo, and setting lives in your browser's IndexedDB on this device.
              There is no server, no account, and nothing to breach. Clearing browser data removes
              it — so export backups from Settings.
            </p>
            <ul className="mt-6 space-y-2.5">
              {ASSURANCES.map((a, i) => (
                <motion.li
                  key={a}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.1em] text-ink-dim"
                >
                  <Check className="size-4 shrink-0 text-patina" aria-hidden />
                  {a}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </RevealItem>
      </Reveal>
    </section>
  );
}

/* -------------------------------- Built with ------------------------------- */

const STACK: { name: string; role: string }[] = [
  { name: "React 19", role: "UI" },
  { name: "TypeScript", role: "Types" },
  { name: "Vite", role: "Build" },
  { name: "Tailwind CSS", role: "Styling" },
  { name: "shadcn/ui", role: "Components" },
  { name: "Radix", role: "Primitives" },
  { name: "Framer Motion", role: "Animation" },
  { name: "GSAP", role: "Scroll storytelling" },
  { name: "Lenis", role: "Smooth scroll" },
  { name: "Dexie", role: "Local database" },
  { name: "Lucide", role: "Icons" },
  { name: "Recharts", role: "Charts" },
];

function BuiltWith() {
  return (
    <section className="mx-auto max-w-[1000px] px-4 py-16 md:px-6">
      <Reveal>
        <RevealItem>
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-px w-6 bg-brass" />
              <span className="overline-label">Colophon</span>
            </div>
            <h2 className="mt-3 font-display text-[24px] font-semibold tracking-[-0.015em] text-ink md:text-[30px]">
              Built with
            </h2>
          </div>
        </RevealItem>
      </Reveal>
      <Reveal stagger={0.05} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STACK.map((t) => (
          <RevealItem key={t.name}>
            <div className="card-hover h-full rounded-[10px] border border-line bg-bg-raised p-5 text-center">
              <p className="font-mono text-[13px] font-medium text-ink">{t.name}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">{t.role}</p>
            </div>
          </RevealItem>
        ))}
      </Reveal>
      <p className="mx-auto mt-8 max-w-[68ch] text-center font-serif text-[15px] leading-[1.7] text-ink-dim">
        Type set in Fraunces, Source Serif 4, and IBM Plex Mono. Interface imagery and the
        workbench photograph were generated for this project and are free to use within it.
        Reference data compiled from open numismatic sources including Wikimedia. Numista is a
        trademark of its owner; Numisma is an independent personal project.
      </p>
    </section>
  );
}

/* -------------------------------- Closing CTA ------------------------------ */

function ClosingCta() {
  return (
    <section className="border-t border-line">
      <Reveal className="mx-auto max-w-[1240px] px-4 py-20 text-center md:px-6">
        <RevealItem>
          <h2 className="font-display text-[28px] font-semibold tracking-[-0.015em] text-ink">
            Start your catalogue.
          </h2>
        </RevealItem>
        <RevealItem>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/scan"
              className="rounded-md bg-brass px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#131009] transition-colors hover:bg-brass-bright"
            >
              Scan a coin
            </Link>
            <Link
              to="/collection"
              className="rounded-md border border-line bg-bg-raised px-4 py-2.5 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
            >
              Browse the examples
            </Link>
          </div>
        </RevealItem>
        <RevealItem>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            Numisma v1.0 · Made for collectors
          </p>
        </RevealItem>
      </Reveal>
    </section>
  );
}

export default function About() {
  return (
    <div>
      <AboutHero />
      <WhyItExists />
      <HowIdentification />
      <Privacy />
      <BuiltWith />
      <ClosingCta />
    </div>
  );
}
