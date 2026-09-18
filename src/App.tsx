import { useEffect, useRef } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { ThemeProvider } from "@/components/ThemeProvider";
import Layout from "@/components/Layout";
import { seedIfEmpty } from "@/lib/db";

import Home from "@/pages/Home";
import Collection from "@/pages/Collection";
import CoinDetail from "@/pages/CoinDetail";
import Scan from "@/pages/Scan";
import Identify from "@/pages/Identify";
import AddCoin from "@/pages/AddCoin";
import EditCoin from "@/pages/EditCoin";
import Stats from "@/pages/Stats";
import Reference from "@/pages/Reference";
import Settings from "@/pages/Settings";
import About from "@/pages/About";
import NotFound from "@/pages/NotFound";

/**
 * Global Lenis smooth scroll (design.md §5): lerp 0.1, disabled under
 * prefers-reduced-motion, killed on unmount. Also scrolls to top on
 * navigation (new page = top; design.md §9).
 */
function SmoothScroll() {
  const location = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({ lerp: 0.1 });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

export default function App() {
  // Seed the 12 demo coins on first run (design.md §7).
  useEffect(() => {
    void seedIfEmpty();
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <SmoothScroll />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="collection" element={<Collection />} />
            <Route path="coin/:id" element={<CoinDetail />} />
            <Route path="scan" element={<Scan />} />
            <Route path="identify" element={<Identify />} />
            <Route path="add" element={<AddCoin />} />
            <Route path="edit/:id" element={<EditCoin />} />
            <Route path="stats" element={<Stats />} />
            <Route path="reference" element={<Reference />} />
            <Route path="settings" element={<Settings />} />
            <Route path="about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
