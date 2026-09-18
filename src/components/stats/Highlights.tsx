import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Coin } from "@/types/coin";
import { coinTitle } from "@/hooks/useCoins";
import { formatDiameter, formatMoney, formatNumber, formatWeight } from "@/lib/format";
import CoinImage from "@/components/coin/CoinImage";

/**
 * Cabinet records (stats.md Row 5): highlight cards with circular flipping
 * coin thumbs. Only records backed by data are shown (up to 6).
 */

interface Record {
  key: string;
  category: string;
  coin: Coin;
  stat: string;
}

function best(coins: Coin[], pick: (c: Coin) => number | undefined, dir: "max" | "min"): Coin | undefined {
  let winner: Coin | undefined;
  let winnerV = dir === "max" ? -Infinity : Infinity;
  for (const c of coins) {
    const v = pick(c);
    if (v == null || !Number.isFinite(v)) continue;
    if ((dir === "max" && v > winnerV) || (dir === "min" && v < winnerV)) {
      winner = c;
      winnerV = v;
    }
  }
  return winner;
}

export default function Highlights({ coins }: { coins: Coin[] }) {
  const records = useMemo(() => {
    const out: Record[] = [];
    const seen = new Set<string>();
    const push = (r: Record | undefined) => {
      if (r && !seen.has(r.coin.id + r.key)) {
        seen.add(r.coin.id + r.key);
        out.push(r);
      }
    };
    const heaviest = best(coins, (c) => c.weightG, "max");
    if (heaviest?.weightG != null)
      push({ key: "heaviest", category: "Heaviest", coin: heaviest, stat: formatWeight(heaviest.weightG).toUpperCase() });
    const largest = best(coins, (c) => c.diameterMm, "max");
    if (largest?.diameterMm != null)
      push({ key: "largest", category: "Largest", coin: largest, stat: formatDiameter(largest.diameterMm).toUpperCase() });
    const valuable = best(coins, (c) => c.estimatedValue, "max");
    if (valuable?.estimatedValue != null)
      push({ key: "valuable", category: "Most valuable", coin: valuable, stat: formatMoney(valuable.estimatedValue).toUpperCase() });
    const rarest = best(coins, (c) => c.mintage, "min");
    if (rarest?.mintage != null)
      push({ key: "rarest", category: "Rarest mintage", coin: rarest, stat: formatNumber(rarest.mintage).toUpperCase() });
    const commonest = best(coins, (c) => c.mintage, "max");
    if (commonest?.mintage != null)
      push({ key: "common", category: "Highest mintage", coin: commonest, stat: formatNumber(commonest.mintage).toUpperCase() });
    const oldest = best(coins, (c) => c.year, "min");
    if (oldest?.year != null)
      push({ key: "oldest", category: "Oldest", coin: oldest, stat: String(oldest.year) });
    return out.slice(0, 6);
  }, [coins]);

  if (records.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
      {records.map((r, i) => (
        <motion.div
          key={r.key}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="card-hover flex flex-col items-center rounded-[10px] border border-line bg-bg-raised p-5 text-center"
        >
          <span className="overline-label">{r.category}</span>
          <div className="mt-4">
            <CoinImage
              obverse={r.coin.images.obverse}
              reverse={r.coin.images.reverse}
              alt={coinTitle(r.coin)}
              size={72}
            />
          </div>
          <Link
            to={`/coin/${r.coin.id}`}
            className="mt-3 line-clamp-2 font-display text-[16px] font-medium leading-snug text-ink transition-colors hover:text-brass"
          >
            {coinTitle(r.coin)}
          </Link>
          <span className="tabular mt-1.5 font-mono text-[12px] text-brass">{r.stat}</span>
        </motion.div>
      ))}
    </div>
  );
}
