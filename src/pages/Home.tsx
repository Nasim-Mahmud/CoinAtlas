import { useEffect, useMemo, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { Link, useNavigate } from "react-router-dom";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowRight, Camera, ChevronRight, Coins, Globe, Scale, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCoins, useRecentCoins } from "@/hooks/useCoins";
import { computeStats, formatAccession, sortCoins } from "@/lib/coin-utils";
import { formatMoney, formatRelativeDate } from "@/lib/format";
import type { Coin } from "@/types/coin";
import StatTile from "@/components/StatTile";
import SectionHeader from "@/components/SectionHeader";
import EmptyState from "@/components/EmptyState";
import { Reveal, RevealItem } from "@/components/Reveal";
import CoinImage, { ReedRing, SvgMask } from "@/components/coin/CoinImage";
import StatusDot from "@/components/coin/StatusDot";
import GradeBadge from "@/components/coin/GradeBadge";
import CabinetStory from "@/components/home/CabinetStory";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ------------------------------ Hero coin ------------------------------ */

function HeroCoin() {
  const [flipped, setFlipped] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const reduced = useReducedMotion();

  // Auto-flip every 6s (paused while a hover/tap flip animates)
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setFlipped((f) => !f), 6000);
    return () => clearInterval(t);
  }, [reduced]);

  const flip = (next: boolean) => {
    setFlipped(next);
    setFlipping(true);
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* spotlight glow */}
      <div aria-hidden className="spot-glow absolute -inset-16 animate-spot-breathe rounded-full" />
      {/* guilloché well */}
      <div className="relative rounded-full bg-inset p-8 sm:p-10">
        <SvgMask
          src={asset("/guilloche-pattern.svg")}
          className="absolute inset-0 size-full rounded-full text-ink opacity-[0.05]"
          style={{ WebkitMaskSize: "480px", maskSize: "480px" }}
        />
        {/* static reed ring at 30% */}
        <ReedRing spinning={false} className="-inset-1 opacity-30" />
        <motion.button
          type="button"
          aria-pressed={flipped}
          aria-label="Flip coin"
          onClick={() => flip(!flipped)}
          onHoverStart={() => flip(true)}
          onHoverEnd={() => flip(false)}
          className="coin-flip-scene relative block w-[min(42vw,480px)] cursor-pointer rounded-full max-lg:w-[min(70vw,380px)]"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.86, rotateY: -30 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.15 }}
        >
          {/* float wrapper (paused while flipping) */}
          <motion.div
            animate={reduced || flipping ? { y: 0 } : { y: [0, -6, 0] }}
            transition={
              flipping ? { duration: 0.3 } : { duration: 6, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <motion.div
              className="coin-flip-inner"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: reduced ? 0 : 1.1, ease: "easeInOut" }}
              onAnimationStart={() => setFlipping(true)}
              onAnimationComplete={() => setFlipping(false)}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="coin-face">
                <img
                  src={asset("/hero-coin-obverse.png")}
                  alt="Obverse of a silver coin — laureate portrait in profile"
                  className="aspect-square w-full select-none rounded-full object-cover shadow-[0_0_0_2px_rgb(var(--line-strong)/0.6)]"
                  draggable={false}
                />
              </div>
              <div className="coin-face coin-face-back">
                <img
                  src={asset("/hero-coin-reverse.png")}
                  alt="Reverse of the same coin — eagle within a laurel wreath"
                  className="aspect-square w-full select-none rounded-full object-cover shadow-[0_0_0_2px_rgb(var(--line-strong)/0.6)]"
                  draggable={false}
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.button>
        {/* soft ellipse shadow, scales with the flip */}
        <motion.div
          aria-hidden
          className="mx-auto mt-6 h-4 w-3/5 rounded-full bg-black/50 blur-md"
          animate={{ scaleX: flipped ? 0.82 : 1, opacity: flipped ? 0.6 : 0.8 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        />
      </div>
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
        Obverse ↔ Reverse · Hover to examine
      </p>
    </div>
  );
}

/* --------------------------------- Hero -------------------------------- */

function Hero({
  stats,
  years,
}: {
  stats: ReturnType<typeof computeStats> | null;
  years: [number, number] | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -180]); // 0.6× parallax
  const coinY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -105]); // 0.35×

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
  };

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div className="mx-auto grid min-h-[92vh] max-w-[1240px] items-center gap-16 px-4 py-12 max-lg:grid-rows-[52vh_auto] lg:grid-cols-[1.05fr_0.95fr] lg:px-6">
        {/* Visual (first on mobile) */}
        <motion.div style={{ y: coinY }} className="order-first flex justify-center lg:order-last">
          <HeroCoin />
        </motion.div>

        {/* Copy */}
        <motion.div style={{ y: copyY }} variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="flex items-center gap-3">
            <span aria-hidden className="h-px w-6 bg-brass" />
            <span aria-hidden className="h-px w-16 bg-line" />
            <span className="overline-label">Personal numismatic cabinet</span>
          </motion.div>
          <motion.h1
            variants={item}
            className="mt-5 font-display text-[40px] font-semibold leading-[1] tracking-[-0.02em] text-ink md:text-[56px] lg:text-[72px] lg:leading-[0.95]"
          >
            Every coin has a story.{" "}
            <em className="font-medium italic text-brass">Catalogue</em> yours.
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-6 max-w-[52ch] font-serif text-[18px] leading-[1.65] text-ink-dim"
          >
            Photograph a coin, identify it, review the details, and file it in your own museum-grade
            catalogue — specs, provenance, grade, and all. Everything stays in your browser.
          </motion.p>
          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/scan"
              className="flex items-center gap-2 rounded-md bg-brass px-5 py-3 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#131009] transition-colors hover:bg-brass-bright"
            >
              <Camera className="size-4" aria-hidden />
              Scan a coin
            </Link>
            <Link
              to="/collection"
              className="rounded-md border border-line bg-bg-raised px-5 py-3 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
            >
              Browse the collection
            </Link>
          </motion.div>
          <motion.p variants={item} className="mt-4 font-mono text-[12px] text-ink-faint">
            or press ⌘K to search
          </motion.p>
          {stats && stats.total > 0 && (
            <motion.p
              variants={item}
              className="tabular mt-8 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-dim"
            >
              {stats.total} {stats.total === 1 ? "entry" : "entries"}
              <span className="mx-2 text-bronze">·</span>
              {stats.countries.length} {stats.countries.length === 1 ? "country" : "countries"}
              {years && (
                <>
                  <span className="mx-2 text-bronze">·</span>
                  Est. {years[0]}–{years[1]}
                </>
              )}
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ----------------------------- Stats strip ----------------------------- */

function StatsStrip({
  stats,
  thisMonth,
}: {
  stats: ReturnType<typeof computeStats>;
  thisMonth: number;
}) {
  const navigate = useNavigate();

  const tiles = [
    {
      label: "Entries",
      value: stats.total,
      icon: Coins,
      caption: thisMonth > 0 ? `+${thisMonth} this month` : "In the cabinet",
      captionClass: thisMonth > 0 ? "text-patina" : undefined,
    },
    {
      label: "Countries & issuers",
      value: stats.countries.length,
      icon: Globe,
      caption: `${stats.decades.length} eras spanned`,
    },
    {
      label: "Total estimated value",
      value: Math.round(stats.totalEstimated),
      icon: Scale,
      format: (n: number) => formatMoney(n),
      caption: `Spend ${formatMoney(stats.totalSpend)}`,
    },
    {
      label: "Pending review",
      value: stats.pending,
      icon: ScanSearch,
      accent: stats.pending > 0 ? ("copper" as const) : ("default" as const),
      caption: stats.pending > 0 ? "Attributions to confirm" : "All attributions confirmed",
      onClick: () => navigate("/collection?status=pending"),
    },
  ];

  return (
    <section aria-label="Collection at a glance" className="border-y border-line bg-bg-raised">
      <Reveal className="mx-auto grid max-w-[1240px] grid-cols-2 lg:grid-cols-4" stagger={0.12}>
        {tiles.map((t, i) => (
          <RevealItem
            key={t.label}
            y={20}
            className={cn("border-line", i > 0 && "border-l", i === 2 && "max-lg:border-l-0 max-lg:border-t", i === 3 && "max-lg:border-t")}
          >
            <StatTile
              label={t.label}
              value={t.value}
              icon={t.icon}
              format={t.format}
              accent={t.accent}
              onClick={t.onClick}
              caption={t.caption}
            />
          </RevealItem>
        ))}
      </Reveal>
    </section>
  );
}

/* ----------------------------- How it works ---------------------------- */

const HOWTO = [
  {
    n: "01",
    title: "Scan",
    img: asset("howto-scan.png"),
    body: "The guided viewfinder aligns the coin and captures both sides in seconds.",
    link: { label: "Try it", to: "/scan" },
  },
  {
    n: "02",
    title: "Identify",
    img: asset("howto-identify.png"),
    body: "Ranked candidates with confidence scores — confirm or correct the attribution.",
    link: null,
  },
  {
    n: "03",
    title: "Catalogue",
    img: asset("howto-catalogue.png"),
    body: "Specs, mintage, grade, provenance — filed under its own accession number.",
    link: null,
  },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-12 lg:px-6 lg:py-20">
      <SectionHeader overline="The workflow" title="From pocket change to catalogue entry" />
      <Reveal className="mt-10 grid gap-6 md:grid-cols-3" stagger={0.1}>
        {HOWTO.map((step) => (
          <RevealItem key={step.n} y={32}>
            <div className="card-hover group h-full overflow-hidden rounded-[10px] border border-line bg-bg-raised">
              <div className="overflow-hidden border-b border-line">
                <img
                  src={step.img}
                  alt={`Illustration — ${step.title}`}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5">
                <span className="tabular font-mono text-[12px] tracking-[0.12em] text-brass">{step.n}</span>
                <h3 className="mt-2 font-display text-[22px] font-medium text-ink">{step.title}</h3>
                <p className="mt-2 font-serif text-[15.5px] leading-[1.65] text-ink-dim">{step.body}</p>
                {step.link && (
                  <Link
                    to={step.link.to}
                    className="mt-4 inline-flex items-center gap-1 font-mono text-[12px] uppercase tracking-[0.12em] text-brass transition-colors hover:text-brass-bright"
                  >
                    {step.link.label}
                    <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-1" aria-hidden />
                  </Link>
                )}
              </div>
            </div>
          </RevealItem>
        ))}
      </Reveal>
    </section>
  );
}

/* --------------------------- Featured entries -------------------------- */

function FeaturedCard({ coin }: { coin: Coin }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const reduced = useReducedMotion();

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -py * 6, y: px * 6 }); // ±3deg around center
  };

  const meta = [
    coin.catalogRefs[0] ? `${coin.catalogRefs[0].system}# ${coin.catalogRefs[0].code}` : null,
    coin.composition ? coin.composition.split(":")[0] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{ transformPerspective: 800 }}
      className="w-[260px] shrink-0 snap-start"
    >
      <Link
        to={`/coin/${coin.id}`}
        className="card-hover relative block rounded-[12px] border border-line bg-bg-raised p-5"
      >
        <div className="absolute left-4 top-4 z-10">
          <GradeBadge grade={coin.grade} />
        </div>
        <div className="absolute right-4 top-4 z-10">
          <StatusDot status={coin.status} />
        </div>
        <div className="mt-5 flex justify-center">
          <CoinImage obverse={coin.images.obverse} reverse={coin.images.reverse} alt={coin.title} size={160} />
        </div>
        <p className="tabular mt-5 font-mono text-[11px] tracking-[0.08em] text-ink-faint">
          {formatAccession(coin.accessionNo)}
        </p>
        <h3 className="mt-1 font-display text-[18px] font-medium leading-snug text-ink">
          {coin.country} {coin.denomination}
          {coin.year != null && (
            <>
              {" "}
              <span className="text-bronze">·</span> {coin.year}
            </>
          )}
        </h3>
        {meta && <p className="mt-1 truncate font-mono text-[12px] text-ink-dim">{meta}</p>}
      </Link>
    </motion.div>
  );
}

function Featured({ coins }: { coins: Coin[] }) {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-12 lg:px-6 lg:py-20">
      <SectionHeader
        overline="From your cabinet"
        title="Featured pieces"
        action={
          <Link
            to="/collection"
            className="inline-flex items-center gap-1 font-mono text-[12px] uppercase tracking-[0.12em] text-brass transition-colors hover:text-brass-bright"
          >
            View all
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        }
      />
      <Reveal className="mt-10" stagger={0.07}>
        <div className="-mx-4 overflow-x-auto px-4 pb-4 lg:-mx-6 lg:px-6">
          <div className="flex snap-x snap-mandatory gap-5 pr-8 max-lg:grid max-lg:snap-none max-lg:grid-cols-2 max-lg:pr-0 max-sm:grid-cols-1">
            {coins.map((c) => (
              <RevealItem key={c.id} className="max-lg:contents">
                <FeaturedCard coin={c} />
              </RevealItem>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* --------------------------- Recently catalogued ----------------------- */

function RecentRow({ coin }: { coin: Coin }) {
  const meta = [coin.country, coin.year != null ? String(coin.year) : coin.era, coin.catalogRefs[0] ? `${coin.catalogRefs[0].system}#${coin.catalogRefs[0].code}` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link
      to={`/coin/${coin.id}`}
      className="group grid grid-cols-[64px_1fr_auto] items-center gap-4 border-b border-line/50 px-2 py-4 transition-colors hover:bg-bg-raised"
    >
      <CoinImage obverse={coin.images.obverse} reverse={coin.images.reverse} alt={coin.title} size={64} />
      <div className="min-w-0">
        <h3 className="truncate font-display text-[17px] font-medium text-ink">{coin.title}</h3>
        <p className="mt-0.5 truncate font-mono text-[12px] text-ink-dim">{meta}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="tabular hidden text-right font-mono text-[12px] text-ink-faint sm:block">
          {formatAccession(coin.accessionNo)}
          <span className="mx-1.5 text-bronze">·</span>
          {formatRelativeDate(coin.createdAt)}
        </span>
        <ChevronRight className="size-4 text-ink-faint transition-transform duration-150 group-hover:translate-x-1 group-hover:text-brass" aria-hidden />
      </div>
    </Link>
  );
}

function RecentlyCatalogued({ coins }: { coins: Coin[] }) {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-12 lg:px-6 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <Reveal>
          <RevealItem>
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-px w-6 bg-brass" />
              <span aria-hidden className="h-px w-12 bg-line" />
              <span className="overline-label">Activity</span>
            </div>
            <h2 className="mt-3 font-display text-[24px] font-semibold text-ink md:text-[30px]">
              Recently catalogued
            </h2>
            <p className="mt-3 font-serif text-[15.5px] leading-[1.65] text-ink-dim">
              The latest additions to the cabinet, fresh from the viewfinder or the bench.
            </p>
            <Link
              to="/collection"
              className="mt-5 inline-flex items-center gap-1 font-mono text-[12px] uppercase tracking-[0.12em] text-brass transition-colors hover:text-brass-bright"
            >
              Open collection
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </RevealItem>
        </Reveal>
        <Reveal stagger={0.06}>
          {coins.map((c) => (
            <RevealItem key={c.id} y={0}>
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <RecentRow coin={c} />
              </motion.div>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ Closing CTA ---------------------------- */

function ClosingCta() {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-12 lg:px-6 lg:py-20">
      <Reveal>
        <RevealItem>
          <div className="relative overflow-hidden rounded-[16px] border border-line bg-inset px-8 py-20 text-center">
            {/* rotating guilloché texture at 4% */}
            <SvgMask
              src={asset("/guilloche-pattern.svg")}
              className="absolute left-1/2 top-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 text-ink opacity-[0.04] motion-safe:animate-[spin_60s_linear_infinite]"
              style={{ WebkitMaskSize: "480px", maskSize: "480px" }}
            />
            <div aria-hidden className="spot-glow absolute left-1/2 top-1/2 size-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
            <div className="relative">
              <div className="flex items-center justify-center gap-3">
                <span aria-hidden className="h-px w-6 bg-brass" />
                <span className="overline-label">Ready when you are</span>
                <span aria-hidden className="h-px w-6 bg-brass" />
              </div>
              <h2 className="mx-auto mt-4 max-w-[20ch] font-display text-[36px] font-semibold leading-tight text-ink">
                The next addition is in your pocket.
              </h2>
              <p className="mx-auto mt-4 max-w-[52ch] font-serif text-[16px] leading-[1.65] text-ink-dim">
                Scan it now — the camera does the heavy lifting, you make the final call.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/scan"
                  className="flex items-center gap-2 rounded-md bg-brass px-5 py-3 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#131009] transition-colors hover:bg-brass-bright"
                >
                  <Camera className="size-4" aria-hidden />
                  Scan a coin
                </Link>
                <Link
                  to="/add"
                  className="rounded-md border border-line bg-bg-raised px-5 py-3 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
                >
                  Add manually
                </Link>
              </div>
              <p className="mt-8 font-mono text-[12px] tracking-[0.08em] text-ink-faint">
                FREE FOREVER · NO ACCOUNT · DATA NEVER LEAVES THIS DEVICE
              </p>
            </div>
          </div>
        </RevealItem>
      </Reveal>
    </section>
  );
}

/* --------------------------------- Page -------------------------------- */

export default function Home() {
  const coins = useCoins();
  const recent = useRecentCoins(6);

  const stats = useMemo(() => (coins ? computeStats(coins) : null), [coins]);
  const years = useMemo<[number, number] | null>(() => {
    if (!coins) return null;
    const ys = coins.map((c) => c.year).filter((y): y is number => y != null);
    if (ys.length === 0) return null;
    return [Math.min(...ys), Math.max(...ys)];
  }, [coins]);
  const thisMonth = useMemo(() => {
    if (!coins) return 0;
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return coins.filter((c) => c.createdAt >= cutoff).length;
  }, [coins]);
  const featured = useMemo(
    () => (coins ? sortCoins(coins, "value", "desc").slice(0, 8) : []),
    [coins],
  );

  const loading = coins === undefined;
  const empty = !loading && coins!.length === 0;

  return (
    <>
      <Hero stats={stats} years={years} />
      {stats && stats.total > 0 && <StatsStrip stats={stats} thisMonth={thisMonth} />}
      <CabinetStory />
      <HowItWorks />
      {empty ? (
        <section className="mx-auto max-w-[1240px] px-4 py-12 lg:px-6 lg:py-20">
          <EmptyState
            headline="Your cabinet awaits its first entry"
            body="Scan a coin with the guided camera, or catalogue one by hand — specs, provenance, grade, and all."
            cta={{ label: "Scan a coin", to: "/scan" }}
            secondaryCta={{ label: "Add manually", to: "/add" }}
          />
        </section>
      ) : (
        <>
          {featured.length > 0 && <Featured coins={featured} />}
          {recent && recent.length > 0 && <RecentlyCatalogued coins={recent} />}
        </>
      )}
      <ClosingCta />
    </>
  );
}
