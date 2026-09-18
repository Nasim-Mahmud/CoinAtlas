import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";
import CommandPalette from "@/components/CommandPalette";
import { useTheme } from "@/components/ThemeProvider";

/**
 * App shell. Owns the fixed-header offset (react-dev.md navbar contract):
 * main carries pt-14 (mobile top bar) / lg:pt-16 (desktop header) and
 * pb-20 (mobile bottom tab bar) / lg:pb-0. Full-bleed heroes opt out inside
 * the page with negative margins — never by removing this offset.
 */
export default function Layout() {
  const { theme } = useTheme();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg text-ink">
      <Navbar />
      <MobileNav />
      <main className="flex-1 pb-20 pt-14 lg:pb-0 lg:pt-16">
        <Outlet />
      </main>
      <Footer />
      <CommandPalette />
      <Toaster
        theme={theme}
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgb(var(--bg-raised))",
            border: "1px solid rgb(var(--line))",
            color: "rgb(var(--ink))",
            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
            fontSize: "13px",
          },
        }}
      />
    </div>
  );
}
