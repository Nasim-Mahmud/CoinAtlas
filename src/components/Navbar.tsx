import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { Camera, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { useCoinCount } from "@/hooks/useCoins";
import { openPalette } from "@/lib/palette";
import { pluralize } from "@/lib/format";
import { SvgMask } from "@/components/coin/CoinImage";

/**
 * Desktop fixed header (design.md §6.1). `fixed top-0 inset-x-0 z-50`.
 * Shrinks 64→56px after 80px scroll; border brightens after 24px.
 * The Layout owns the matching top offset.
 */

const NAV_LINKS = [
  { to: "/collection", label: "Collection" },
  { to: "/scan", label: "Scan" },
  { to: "/stats", label: "Stats" },
  { to: "/reference", label: "Reference" },
  { to: "/about", label: "About" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to Album (light) theme" : "Switch to Cabinet (dark) theme"}
      className={cn(
        "flex size-9 items-center justify-center rounded-md border border-line text-ink-dim transition-colors hover:border-line-strong hover:text-ink",
        className,
      )}
    >
      <span className="relative block size-4">
        <Sun
          className={cn(
            "absolute inset-0 size-4 transition-transform duration-300",
            theme === "dark" ? "rotate-180 opacity-0" : "rotate-0 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 size-4 transition-transform duration-300",
            theme === "dark" ? "rotate-0 opacity-100" : "-rotate-180 opacity-0",
          )}
        />
      </span>
    </button>
  );
}

export default function Navbar() {
  const count = useCoinCount();
  const location = useLocation();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const height = useSpring(64, { stiffness: 260, damping: 30 });

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 24);
    height.set(y > 80 ? 56 : 64);
  });

  return (
    <motion.header
      style={{ height }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 hidden border-b bg-bg/85 backdrop-blur-md lg:block",
        scrolled ? "border-line-strong" : "border-line",
      )}
    >
      <div className="mx-auto flex h-full max-w-[1240px] items-center justify-between gap-6 px-6">
        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 text-brass" aria-label="Numisma — home">
          <SvgMask src="/logo.svg" className="size-6" />
          <span className="font-display text-[18px] font-semibold tracking-[0.06em] text-ink">NUMISMA</span>
        </Link>

        {/* Center nav */}
        <nav className="flex items-center gap-1" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.to || location.pathname.startsWith(`${link.to}/`);
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={cn(
                  "relative px-3 py-2 font-mono text-[12px] font-medium uppercase tracking-[0.12em] transition-colors",
                  active ? "text-brass" : "text-ink-dim hover:text-ink",
                )}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-[1px] h-[2px] bg-brass"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 rounded-full border border-line bg-bg-raised px-2.5 py-1 font-mono text-[12px] text-ink-dim xl:inline-flex"
            title="Entries in your cabinet"
          >
            <span className="size-1.5 rounded-full bg-patina" aria-hidden />
            {count != null ? pluralize(count, "entry", "entries") : "…"}
          </span>
          <button
            type="button"
            onClick={openPalette}
            aria-label="Open command palette (⌘K)"
            className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[12px] text-ink-dim transition-colors hover:border-line-strong hover:text-ink"
          >
            <span aria-hidden>⌘K</span>
          </button>
          <ThemeToggle />
          <Link
            to="/scan"
            className="flex items-center gap-2 rounded-md bg-brass px-3.5 py-2 font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#131009] transition-colors hover:bg-brass-bright"
          >
            <Camera className="size-4" aria-hidden />
            Scan coin
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
