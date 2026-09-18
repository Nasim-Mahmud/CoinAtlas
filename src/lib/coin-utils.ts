import Fuse from "fuse.js";
import type { Coin, CoinStatus } from "@/types/coin";

/**
 * Pure helpers shared by every page. No Dexie / React imports here.
 */

/** "Nº 0007" — museum accession label format (design.md §1). */
export function formatAccession(n: number): string {
  return `Nº ${String(n).padStart(4, "0")}`;
}

/**
 * Display title with the denomination + year pairing signature:
 * "France 2 Euro · 1999", "Roman Empire Denarius · c. 117–138 AD".
 */
export function coinTitle(c: Coin): string {
  const when = c.year != null ? String(c.year) : c.era;
  const base = `${c.country} ${c.denomination}`.trim();
  return when ? `${base} · ${when}` : base;
}

/** "1990s" from 1999; undefined when no Gregorian year exists. */
export function decadeOf(year?: number): string | undefined {
  if (year == null || !Number.isFinite(year)) return undefined;
  return `${Math.floor(year / 10) * 10}s`;
}

/** Decade/era bucket used by stats + filters. */
export function decadeLabel(c: Coin): string {
  return decadeOf(c.year) ?? (c.era ? "Ancient" : "Undated");
}

/* ---------------- grade ranking (for sortCoins "grade") ---------------- */

const GRADE_WORD_RANK: Record<string, number> = {
  P: 1, PR: 2, PO: 1, AG: 3, G: 4, VG: 8, F: 12, VF: 20, XF: 40, EF: 40,
  AU: 50, UNC: 60, MS: 60, BU: 63, PL: 60, PF: 60, PROOF: 60,
};

/** Numeric rank for adjectival/Sheldon grades ("VF", "VF 30", "MS63", "EF45"). */
export function gradeRank(grade?: string): number {
  if (!grade) return -1;
  const g = grade.toUpperCase().replace(/[^A-Z0-9 ]/g, " ").trim();
  const num = g.match(/\d+/);
  const word = g.match(/[A-Z]+/)?.[0] ?? "";
  if (word === "MS" || word === "PF" || word === "PR" || word === "SP") {
    return 60 + (num ? Math.min(70, parseInt(num[0], 10)) - 60 : 3);
  }
  const base = GRADE_WORD_RANK[word] ?? -1;
  if (base < 0) return num ? parseInt(num[0], 10) : -1;
  // fold the trailing Sheldon number in as a fine adjustment
  if (num) {
    const n = parseInt(num[0], 10);
    return Math.min(base + Math.max(0, n - (base >= 60 ? 60 : 0)), base + 19);
  }
  return base;
}

/* ----------------------------- filtering ------------------------------ */

export interface CoinFilter {
  q?: string;
  country?: string;
  decade?: string; // "1990s" | "Ancient" | "Undated"
  composition?: string;
  status?: CoinStatus;
  tags?: string[];
  grade?: string;
}

export function filterCoins(coins: Coin[], f: CoinFilter): Coin[] {
  const q = f.q?.trim().toLowerCase();
  return coins.filter((c) => {
    if (f.country && c.country !== f.country) return false;
    if (f.decade && decadeLabel(c) !== f.decade) return false;
    if (f.composition && !(c.composition ?? "").toLowerCase().includes(f.composition.toLowerCase()))
      return false;
    if (f.status && c.status !== f.status) return false;
    if (f.tags && f.tags.length > 0 && !f.tags.some((t) => c.tags.includes(t))) return false;
    if (f.grade && (c.grade ?? "").toUpperCase() !== f.grade.toUpperCase()) return false;
    if (q) {
      const hay = [
        c.title,
        c.country,
        c.issuer ?? "",
        c.denomination,
        c.year != null ? String(c.year) : "",
        c.era ?? "",
        c.mint ?? "",
        c.composition ?? "",
        c.grade ?? "",
        c.notes ?? "",
        formatAccession(c.accessionNo),
        String(c.accessionNo),
        ...c.tags,
        ...c.catalogRefs.map((r) => `${r.system} ${r.code}`),
        ...c.catalogRefs.map((r) => r.code),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/* ------------------------------ sorting ------------------------------- */

export type SortKey = "accession" | "country" | "year" | "denomination" | "updated" | "grade" | "value";
export type SortDir = "asc" | "desc";

export function sortCoins(coins: Coin[], key: SortKey, dir: SortDir = "asc"): Coin[] {
  const sign = dir === "asc" ? 1 : -1;
  const sorted = [...coins].sort((a, b) => {
    switch (key) {
      case "accession":
        return (a.accessionNo - b.accessionNo) * sign;
      case "country":
        return (a.country.localeCompare(b.country) || a.accessionNo - b.accessionNo) * sign;
      case "year": {
        const ay = a.year ?? -Infinity;
        const by = b.year ?? -Infinity;
        return (ay - by || a.accessionNo - b.accessionNo) * sign;
      }
      case "denomination":
        return (a.denomination.localeCompare(b.denomination) || a.accessionNo - b.accessionNo) * sign;
      case "updated":
        return (a.updatedAt - b.updatedAt) * sign;
      case "grade":
        return (gradeRank(a.grade) - gradeRank(b.grade) || a.accessionNo - b.accessionNo) * sign;
      case "value": {
        const av = a.estimatedValue ?? a.pricePaid ?? -Infinity;
        const bv = b.estimatedValue ?? b.pricePaid ?? -Infinity;
        return (av - bv || a.accessionNo - b.accessionNo) * sign;
      }
    }
  });
  return sorted;
}

/* ------------------------------ statistics ----------------------------- */

export interface NameCount {
  name: string;
  count: number;
}

export interface CollectionStats {
  total: number;
  verified: number;
  pending: number;
  draft: number;
  byCountry: NameCount[];
  byDecade: NameCount[];
  byComposition: NameCount[];
  byGrade: NameCount[];
  totalSpend: number;
  totalEstimated: number;
  countries: string[];
  tags: string[];
  compositions: string[];
  decades: string[];
}

function tally(map: Map<string, number>): NameCount[] {
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function computeStats(coins: Coin[]): CollectionStats {
  const countryMap = new Map<string, number>();
  const decadeMap = new Map<string, number>();
  const compMap = new Map<string, number>();
  const gradeMap = new Map<string, number>();
  const tagSet = new Set<string>();
  let verified = 0;
  let pending = 0;
  let draft = 0;
  let totalSpend = 0;
  let totalEstimated = 0;

  for (const c of coins) {
    countryMap.set(c.country, (countryMap.get(c.country) ?? 0) + 1);
    decadeMap.set(decadeLabel(c), (decadeMap.get(decadeLabel(c)) ?? 0) + 1);
    if (c.composition) {
      // group by the leading material word ("Silver .900" → "Silver")
      const family = c.composition.split(/[ :/.,(]/)[0]?.trim() || c.composition;
      compMap.set(family, (compMap.get(family) ?? 0) + 1);
    }
    if (c.grade) gradeMap.set(c.grade, (gradeMap.get(c.grade) ?? 0) + 1);
    c.tags.forEach((t) => tagSet.add(t));
    if (c.status === "verified") verified++;
    else if (c.status === "pending") pending++;
    else draft++;
    if (c.pricePaid != null) totalSpend += c.pricePaid;
    if (c.estimatedValue != null) totalEstimated += c.estimatedValue;
  }

  const byCountry = tally(countryMap);
  const byComposition = tally(compMap);
  const byGrade = [...gradeMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => gradeRank(a.name) - gradeRank(b.name));
  const byDecade = [...decadeMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      const an = parseInt(a.name, 10);
      const bn = parseInt(b.name, 10);
      if (Number.isNaN(an) && Number.isNaN(bn)) return a.name.localeCompare(b.name);
      if (Number.isNaN(an)) return -1; // Ancient first
      if (Number.isNaN(bn)) return 1;
      return an - bn;
    });

  return {
    total: coins.length,
    verified,
    pending,
    draft,
    byCountry,
    byDecade,
    byComposition,
    byGrade,
    totalSpend,
    totalEstimated,
    countries: byCountry.map((c) => c.name),
    tags: [...tagSet].sort((a, b) => a.localeCompare(b)),
    compositions: byComposition.map((c) => c.name),
    decades: byDecade.map((d) => d.name),
  };
}

/* --------------------------- fuzzy search ------------------------------ */

const fuseKeys = [
  { name: "title", weight: 3 },
  { name: "country", weight: 2 },
  { name: "denomination", weight: 2 },
  { name: "catalogRefs.code", weight: 2 },
  { name: "accessionNo", weight: 2 },
  { name: "tags", weight: 1.5 },
  { name: "notes", weight: 1 },
  { name: "mint", weight: 1 },
  { name: "era", weight: 1 },
];

/** Fuse.js fuzzy search across the catalogue fields that matter. */
export function fuseSearch(coins: Coin[], query: string): Coin[] {
  const q = query.trim();
  if (!q) return coins;
  const fuse = new Fuse(coins, {
    keys: fuseKeys,
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: false,
  });
  return fuse.search(q).map((r) => r.item);
}
