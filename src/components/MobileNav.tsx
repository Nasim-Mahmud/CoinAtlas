import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, BookOpen, Camera, Info, Layers, Menu, Moon, Plus, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { openPalette } from "@/lib/palette";
import { SvgMask } from "@/components/coin/CoinImage";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Mobile navigation (design.md §6.2): h-14 top bar (logo, ⌘K, theme) + fixed
 * bottom tab bar with a raised brass Scan FAB. <1024px only (Layout toggles).
 */

const TABS_LEFT = [
  { to: "/collection", label: "Collection", icon: Layers },
  { to: "/stats", label: "Stats", icon: BarChart3 },
];
const TABS_RIGHT = [{ to: "/add", label: "Add", icon: Plus }];

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  const moreItems = [
    { to: "/reference", label: "Reference", icon: BookOpen },
    { to: "/about", label: "About", icon: Info },
    { to: "/settings", label: "Settings", icon: Menu },
  ];

  return (
    <div className="lg:hidden">
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-line bg-bg/85 px-4 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2 text-brass" aria-label="Numisma — home">
          <SvgMask src="/logo.svg" className="size-5" />
          <span className="font-display text-[16px] font-semibold tracking-[0.06em] text-ink">NUMISMA</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openPalette}
            aria-label="Open command palette"
            className="flex size-9 items-center justify-center rounded-md border border-line font-mono text-[11px] text-ink-dim"
          >
            ⌘K
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex size-9 items-center justify-center rounded-md border border-line text-ink-dim"
          >
            {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>
        </div>
      </header>

      {/* Bottom tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg-raised/95 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid h-16 grid-cols-5 items-end">
          {TABS_LEFT.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em]",
                isActive(tab.to) ? "text-brass" : "text-ink-faint",
              )}
            >
              <tab.icon className="size-5" aria-hidden />
              {tab.label}
            </NavLink>
          ))}

          {/* Center Scan FAB */}
          <div className="relative flex h-16 items-start justify-center">
            <motion.div whileTap={{ scale: 0.9 }}>
              <button
                type="button"
                onClick={() => navigate("/scan")}
                aria-label="Scan a coin"
                className="absolute -top-[14px] left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-brass text-[#131009] shadow-fab-brass transition-colors hover:bg-brass-bright"
              >
                <Camera className="size-6" aria-hidden />
              </button>
            </motion.div>
            <span
              className={cn(
                "mt-auto pb-2 font-mono text-[10px] uppercase tracking-[0.08em]",
                isActive("/scan") ? "text-brass" : "text-ink-faint",
              )}
            >
              Scan
            </span>
          </div>

          {TABS_RIGHT.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em]",
                isActive(tab.to) ? "text-brass" : "text-ink-faint",
              )}
            >
              <tab.icon className="size-5" aria-hidden />
              {tab.label}
            </NavLink>
          ))}

          {/* More → sheet */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex h-16 flex-col items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint"
                aria-label="More navigation"
              >
                <Menu className="size-5" aria-hidden />
                More
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] border-line bg-bg-raised">
              <SheetHeader>
                <SheetTitle className="font-display text-ink">Cabinet</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                {moreItems.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => {
                      setSheetOpen(false);
                      navigate(item.to);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-3 font-mono text-[13px] uppercase tracking-[0.1em] transition-colors",
                      isActive(item.to) ? "bg-bg-inset text-brass" : "text-ink-dim hover:bg-bg-inset hover:text-ink",
                    )}
                  >
                    <item.icon className="size-4" aria-hidden />
                    {item.label}
                  </button>
                ))}
                <div className="my-3 h-px bg-line" />
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-3 rounded-md px-3 py-3 font-mono text-[13px] uppercase tracking-[0.1em] text-ink-dim transition-colors hover:bg-bg-inset hover:text-ink"
                >
                  {theme === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
                  {theme === "dark" ? "Album (light) theme" : "Cabinet (dark) theme"}
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}
