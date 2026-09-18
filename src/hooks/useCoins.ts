import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Coin, NewCoinInput } from "@/types/coin";

/**
 * Live-query hooks + mutations over the coins table.
 * All hooks re-render automatically when IndexedDB changes.
 */

/** All coins, sorted by accession number. Undefined while loading. */
export function useCoins(): Coin[] | undefined {
  return useLiveQuery(() => db.coins.orderBy("accessionNo").toArray(), []);
}

/** A single coin by id. Undefined while loading / when missing. */
export function useCoin(id: string | undefined): Coin | undefined {
  return useLiveQuery(() => (id ? db.coins.get(id) : undefined), [id]);
}

/** Total number of entries (0 when empty, undefined while loading). */
export function useCoinCount(): number | undefined {
  return useLiveQuery(() => db.coins.count(), []);
}

/** The n most recently catalogued entries (by createdAt, newest first). */
export function useRecentCoins(n: number): Coin[] | undefined {
  return useLiveQuery(
    async () => {
      const all = await db.coins.toArray();
      return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, n);
    },
    [n],
  );
}

/**
 * Create a coin. Assigns id (crypto.randomUUID), the next accession number,
 * createdAt/updatedAt, defaults status to "draft". Returns the new coin.
 */
export async function addCoin(input: NewCoinInput): Promise<Coin> {
  const last = await db.coins.orderBy("accessionNo").last();
  const now = Date.now();
  const coin: Coin = {
    catalogRefs: [],
    tags: [],
    images: {},
    sources: [],
    status: "draft",
    ...input,
    id: crypto.randomUUID(),
    accessionNo: (last?.accessionNo ?? 0) + 1,
    createdAt: now,
    updatedAt: now,
  };
  await db.coins.add(coin);
  return coin;
}

/** Patch a coin; touches updatedAt. Returns the updated coin or undefined. */
export async function updateCoin(id: string, patch: Partial<Omit<Coin, "id" | "createdAt">>): Promise<Coin | undefined> {
  const existing = await db.coins.get(id);
  if (!existing) return undefined;
  const next: Coin = { ...existing, ...patch, id, createdAt: existing.createdAt, updatedAt: Date.now() };
  await db.coins.put(next);
  return next;
}

/** Delete a coin by id. */
export async function deleteCoin(id: string): Promise<void> {
  await db.coins.delete(id);
}

/* Pure helpers re-exported so pages can import everything coin-related
   from one place if they prefer. */
export {
  formatAccession,
  coinTitle,
  decadeOf,
  filterCoins,
  sortCoins,
  computeStats,
  fuseSearch,
  gradeRank,
} from "@/lib/coin-utils";
export type { CoinFilter, SortKey, SortDir, CollectionStats, NameCount } from "@/lib/coin-utils";
