import { asset } from "@/lib/asset";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useCoinCount } from "@/hooks/useCoins";
import { SvgMask } from "@/components/coin/CoinImage";

/** Site footer (design.md §6.3) with live entry count. */
export default function Footer() {
  const count = useCoinCount();
  const year = new Date().getFullYear();

  const links = [
    { to: "/collection", label: "Collection" },
    { to: "/scan", label: "Scan" },
    { to: "/stats", label: "Stats" },
    { to: "/reference", label: "Reference" },
    { to: "/about", label: "About" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:px-6">
        {/* 1 — wordmark + tagline */}
        <div>
          <Link to="/" className="flex items-center gap-2.5 text-brass">
            <SvgMask src={asset("logo.svg")} className="size-6" />
            <span className="font-display text-[18px] font-semibold tracking-[0.06em] text-ink">NUMISMA</span>
          </Link>
          <p className="mt-3 max-w-[36ch] font-serif text-[15px] leading-[1.65] text-ink-dim">
            A personal cabinet of curiosities — catalogued, not just kept.
          </p>
          <p className="mt-4 font-mono text-[12px] text-ink-faint">© {year}</p>
        </div>

        {/* 2 — site links */}
        <nav aria-label="Footer" className="flex flex-col gap-2">
          <span className="overline-label mb-1">Cabinet</span>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="w-fit font-mono text-[12px] uppercase tracking-[0.1em] text-ink-dim transition-colors hover:text-brass"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* 3 — data note */}
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 size-4 shrink-0 text-patina" aria-hidden />
          <p className="font-serif text-[14.5px] leading-[1.65] text-ink-dim">
            All data lives in your browser (IndexedDB). Nothing is uploaded. Export anytime from Settings.
          </p>
        </div>
      </div>

      {/* Bottom hairline row */}
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 px-4 py-4 lg:px-6">
          <span className="font-mono text-[12px] text-ink-faint">Built with React · Vite · Tailwind</span>
          <span className="tabular font-mono text-[12px] text-ink-faint">
            {count != null ? `Nº of entries: ${count}` : ""}
          </span>
        </div>
      </div>
    </footer>
  );
}
