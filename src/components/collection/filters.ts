import type { Coin, CoinStatus } from "@/types/coin";
import { decadeLabel, gradeRank, sortCoins } from "@/lib/coin-utils";
import type { SortKey, SortDir } from "@/lib/coin-utils";

/**
 * Collection filter/sort/view state, mirrored to URL search params
 * (collection.md "Notes": ?q=&country=&decade=&status=&sort=&view=).
 * Multi-value facets are comma-separated in the URL.
 */

export type FacetGroup =
  | "status"
  | "country"
  | "decade"
  | "composition"
  | "denomination"
  | "grade"
  | "year"
  | "tag";

export type ViewMode = "grid" | "list";

export type SortId =
  | "relevance"
  | "accession"
  | "newest"
  | "oldest"
  | "country"
  | "denomination"
  | "value-desc"
  | "value-asc";

export const SORT_OPTIONS: { id: SortId; label: string; key?: SortKey; dir?: SortDir }[] = [
  { id: "relevance", label: "Relevance" },
  { id: "accession", label: "Accession Nº", key: "accession", dir: "asc" },
  { id: "newest", label: "Newest", key: "updated", dir: "desc" },
  { id: "oldest", label: "Oldest year", key: "year", dir: "asc" },
  { id: "country", label: "Country A–Z", key: "country", dir: "asc" },
  { id: "denomination", label: "Denomination", key: "denomination", dir: "asc" },
  { id: "value-desc", label: "Value ↓", key: "value", dir: "desc" },
  { id: "value-asc", label: "Value ↑", key: "value", dir: "asc" },
];

export interface Facets {
  q: string;
  statuses: CoinStatus[];
  countries: string[];
  decades: string[];
  compositions: string[];
  denominations: string[];
  /** Minimum gradeRank (0 = any). */
  gradeMin: number;
  yearMin: number | null;
  yearMax: number | null;
  tags: string[];
  sort: SortId;
  view: ViewMode;
}

export const DEFAULT_FACETS: Facets = {
  q: "",
  statuses: [],
  countries: [],
  decades: [],
  compositions: [],
  denominations: [],
  gradeMin: 0,
  yearMin: null,
  yearMax: null,
  tags: [],
  sort: "accession",
  view: "grid",
};

/** Grade slider stops (collection.md §6): mapped to gradeRank thresholds. */
export const GRADE_STOPS: { label: string; rank: number }[] = [
  { label: "Any", rank: 0 },
  { label: "G", rank: 4 },
  { label: "VG", rank: 8 },
  { label: "F", rank: 12 },
  { label: "VF", rank: 20 },
  { label: "EF", rank: 40 },
  { label: "AU", rank: 50 },
  { label: "MS", rank: 60 },
];

const STATUSES: CoinStatus[] = ["verified", "pending", "draft"];

function list(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function num(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function parseFacets(params: URLSearchParams): Facets {
  const sortRaw = params.get("sort") as SortId | null;
  const viewRaw = params.get("view") as ViewMode | null;
  return {
    q: params.get("q") ?? "",
    statuses: list(params, "status").filter((s): s is CoinStatus => STATUSES.includes(s as CoinStatus)),
    countries: list(params, "country"),
    decades: list(params, "decade"),
    compositions: list(params, "composition"),
    denominations: list(params, "denomination"),
    gradeMin: num(params, "grade") ?? 0,
    yearMin: num(params, "ymin"),
    yearMax: num(params, "ymax"),
    tags: list(params, "tag"),
    sort: sortRaw && SORT_OPTIONS.some((o) => o.id === sortRaw) ? sortRaw : "accession",
    view: viewRaw === "list" || viewRaw === "grid" ? viewRaw : "grid",
  };
}

/** Serialize facets to URL params, omitting defaults. */
export function facetsToParams(f: Facets): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.statuses.length) p.set("status", f.statuses.join(","));
  if (f.countries.length) p.set("country", f.countries.join(","));
  if (f.decades.length) p.set("decade", f.decades.join(","));
  if (f.compositions.length) p.set("composition", f.compositions.join(","));
  if (f.denominations.length) p.set("denomination", f.denominations.join(","));
  if (f.gradeMin > 0) p.set("grade", String(f.gradeMin));
  if (f.yearMin != null) p.set("ymin", String(f.yearMin));
  if (f.yearMax != null) p.set("ymax", String(f.yearMax));
  if (f.tags.length) p.set("tag", f.tags.join(","));
  if (f.sort !== "accession") p.set("sort", f.sort);
  if (f.view !== "grid") p.set("view", f.view);
  return p;
}

/** Toggle helper for multi-value facet arrays. */
export function toggleValue(list: string[], v: string): string[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function toggleStatus(list: CoinStatus[], v: CoinStatus): CoinStatus[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

/**
 * Apply all facets (search is handled separately via fuseSearch).
 * `exclude` skips one facet group so its option counts can be computed
 * against the rest of the filter set (collection.md facet contract).
 */
export function applyFacets(coins: Coin[], f: Facets, exclude?: FacetGroup): Coin[] {
  return coins.filter((c) => {
    if (exclude !== "status" && f.statuses.length && !f.statuses.includes(c.status)) return false;
    if (exclude !== "country" && f.countries.length && !f.countries.includes(c.country)) return false;
    if (exclude !== "decade" && f.decades.length && !f.decades.includes(decadeLabel(c))) return false;
    if (
      exclude !== "composition" &&
      f.compositions.length &&
      !f.compositions.some((comp) => (c.composition ?? "").toLowerCase().includes(comp.toLowerCase()))
    )
      return false;
    if (
      exclude !== "denomination" &&
      f.denominations.length &&
      !f.denominations.includes(c.denomination)
    )
      return false;
    if (exclude !== "grade" && f.gradeMin > 0 && gradeRank(c.grade) < f.gradeMin) return false;
    if (exclude !== "year") {
      if (f.yearMin != null && (c.year ?? Number.NEGATIVE_INFINITY) < f.yearMin) return false;
      if (f.yearMax != null && (c.year ?? Number.POSITIVE_INFINITY) > f.yearMax) return false;
    }
    if (exclude !== "tag" && f.tags.length && !f.tags.some((t) => c.tags.includes(t))) return false;
    return true;
  });
}

/** Sort a filtered list. "relevance" preserves the fuse.js order. */
export function applySort(coins: Coin[], f: Facets): Coin[] {
  const opt = SORT_OPTIONS.find((o) => o.id === f.sort) ?? SORT_OPTIONS[1];
  if (!opt.key || !opt.dir) return coins;
  return sortCoins(coins, opt.key, opt.dir);
}

/** Number of active filter facets (excludes search/sort/view). */
export function activeFilterCount(f: Facets): number {
  return (
    f.statuses.length +
    f.countries.length +
    f.decades.length +
    f.compositions.length +
    f.denominations.length +
    (f.gradeMin > 0 ? 1 : 0) +
    (f.yearMin != null || f.yearMax != null ? 1 : 0) +
    f.tags.length
  );
}

/** Chip descriptors for the toolbar's removable active-filter chips. */
export interface ActiveChip {
  group: FacetGroup;
  label: string;
  /** Value inside the group (unused for single-value groups). */
  value?: string;
}

export function activeChips(f: Facets): ActiveChip[] {
  const chips: ActiveChip[] = [];
  f.statuses.forEach((s) =>
    chips.push({
      group: "status",
      value: s,
      label: s === "verified" ? "Verified" : s === "pending" ? "Pending review" : "Draft",
    }),
  );
  f.countries.forEach((c) => chips.push({ group: "country", value: c, label: c }));
  f.decades.forEach((d) => chips.push({ group: "decade", value: d, label: d }));
  f.compositions.forEach((c) => chips.push({ group: "composition", value: c, label: c }));
  f.denominations.forEach((d) => chips.push({ group: "denomination", value: d, label: d }));
  if (f.gradeMin > 0) {
    const stop = [...GRADE_STOPS].reverse().find((s) => f.gradeMin >= s.rank && s.rank > 0);
    chips.push({ group: "grade", label: `Grade ≥ ${stop?.label ?? f.gradeMin}` });
  }
  if (f.yearMin != null || f.yearMax != null) {
    chips.push({
      group: "year",
      label: `${f.yearMin ?? "…"}–${f.yearMax ?? "…"}`,
    });
  }
  f.tags.forEach((t) => chips.push({ group: "tag", value: t, label: `#${t}` }));
  return chips;
}
