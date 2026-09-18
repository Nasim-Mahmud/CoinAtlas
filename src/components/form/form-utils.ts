import { z } from "zod";
import type { CatalogRef, Coin, CoinImages, CoinSource, CoinStatus } from "@/types/coin";

/**
 * Shared plumbing for the Add / Edit catalogue form (add-edit.md).
 * Everything is optional — a blank save produces a draft entry.
 */

/* ------------------------------ zod schema ------------------------------ */

const numericString = (label: string, max?: number) =>
  z
    .string()
    .trim()
    .refine((s) => s === "" || (Number.isFinite(Number(s)) && Number(s) >= 0), {
      message: `${label} must be a positive number`,
    })
    .refine((s) => s === "" || max === undefined || Number(s) <= max, {
      message: `${label} must be ${max} or less`,
    });

export const coinFormSchema = z.object({
  country: z.string(),
  issuer: z.string(),
  denomination: z.string(),
  currency: z.string(),
  yearText: z.string(),
  mint: z.string(),
  mintMark: z.string(),
  composition: z.string(),
  weightG: numericString("Weight"),
  diameterMm: numericString("Diameter"),
  thicknessMm: numericString("Thickness"),
  shape: z.string(),
  edge: z.string(),
  obverseDesc: z.string(),
  obverseLettering: z.string(),
  reverseDesc: z.string(),
  reverseLettering: z.string(),
  designer: z.string(),
  engraver: z.string(),
  mintage: numericString("Mintage"),
  catalogRefs: z.array(z.object({ system: z.string(), code: z.string() })),
  sources: z.array(
    z.object({
      label: z.string(),
      url: z.string().refine((s) => s === "" || /^https?:\/\/.+\..+/.test(s.trim()), {
        message: "Enter a full URL (https://…)",
      }),
    }),
  ),
  status: z.enum(["draft", "pending", "verified"]),
  grade: z.string(),
  quantity: numericString("Quantity"),
  confidence: numericString("Confidence", 100),
  acquiredDate: z.string(),
  acquiredFrom: z.string(),
  pricePaid: numericString("Price paid"),
  estimatedValue: numericString("Estimated value"),
  storageLocation: z.string(),
  tags: z.array(z.string()),
  notes: z.string(),
  images: z.object({
    obverse: z.string().optional(),
    reverse: z.string().optional(),
    edge: z.string().optional(),
  }),
});

export type CoinFormValues = z.infer<typeof coinFormSchema>;

export const EMPTY_FORM_VALUES: CoinFormValues = {
  country: "",
  issuer: "",
  denomination: "",
  currency: "",
  yearText: "",
  mint: "",
  mintMark: "",
  composition: "",
  weightG: "",
  diameterMm: "",
  thicknessMm: "",
  shape: "",
  edge: "",
  obverseDesc: "",
  obverseLettering: "",
  reverseDesc: "",
  reverseLettering: "",
  designer: "",
  engraver: "",
  mintage: "",
  catalogRefs: [],
  sources: [],
  status: "draft",
  grade: "",
  quantity: "",
  confidence: "",
  acquiredDate: "",
  acquiredFrom: "",
  pricePaid: "",
  estimatedValue: "",
  storageLocation: "",
  tags: [],
  notes: "",
  images: {},
};

/* --------------------------- value conversions -------------------------- */

const trim = (s: string) => s.trim();
const opt = (s: string) => {
  const t = s.trim();
  return t === "" ? undefined : t;
};
const num = (s: string) => {
  const t = s.trim();
  if (t === "") return undefined;
  const n = Number(t.replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

/** Coin carries `quantity` in the catalogue desk but the core type predates
 *  it — persisted via this widening (round-trips through export/import). */
export type CoinWithQuantity = Coin & { quantity?: number };

function joinDesc(desc: string, lettering: string): string | undefined {
  const d = desc.trim();
  const l = lettering.trim();
  if (!d && !l) return undefined;
  if (!l) return d;
  if (!d) return `Lettering: ${l}`;
  return `${d}\n\nLettering: ${l}`;
}

function splitDesc(desc?: string): { desc: string; lettering: string } {
  if (!desc) return { desc: "", lettering: "" };
  const m = desc.match(/^(.*)\n\nLettering: ([\s\S]*)$/);
  if (m) return { desc: m[1], lettering: m[2] };
  if (desc.startsWith("Lettering: ")) return { desc: "", lettering: desc.slice(11) };
  return { desc, lettering: "" };
}

/** Map a Coin (or partial prefill from /identify) into form values. */
export function coinToFormValues(coin: Partial<CoinWithQuantity>): CoinFormValues {
  const obv = splitDesc(coin.obverseDesc);
  const rev = splitDesc(coin.reverseDesc);
  return {
    ...EMPTY_FORM_VALUES,
    country: coin.country ?? "",
    issuer: coin.issuer ?? "",
    denomination: coin.denomination ?? "",
    currency: coin.currency ?? "",
    yearText: coin.year != null ? String(coin.year) : (coin.era ?? ""),
    mint: coin.mint ?? "",
    mintMark: coin.mintMark ?? "",
    composition: coin.composition ?? "",
    weightG: coin.weightG != null ? String(coin.weightG) : "",
    diameterMm: coin.diameterMm != null ? String(coin.diameterMm) : "",
    thicknessMm: coin.thicknessMm != null ? String(coin.thicknessMm) : "",
    shape: coin.shape ?? "",
    edge: coin.edge ?? "",
    obverseDesc: obv.desc,
    obverseLettering: obv.lettering,
    reverseDesc: rev.desc,
    reverseLettering: rev.lettering,
    designer: coin.designer ?? "",
    engraver: coin.engraver ?? "",
    mintage: coin.mintage != null ? String(coin.mintage) : "",
    catalogRefs: (coin.catalogRefs ?? []).map((r) => ({ ...r })),
    sources: (coin.sources ?? []).map((s) => ({ ...s })),
    status: coin.status ?? "draft",
    grade: coin.grade ?? "",
    quantity: coin.quantity != null ? String(coin.quantity) : "",
    confidence: coin.confidence != null ? String(coin.confidence) : "",
    acquiredDate: coin.acquiredDate ?? "",
    acquiredFrom: coin.acquiredFrom ?? "",
    pricePaid: coin.pricePaid != null ? String(coin.pricePaid) : "",
    estimatedValue: coin.estimatedValue != null ? String(coin.estimatedValue) : "",
    storageLocation: coin.storageLocation ?? "",
    tags: [...(coin.tags ?? [])],
    notes: coin.notes ?? "",
    images: { ...(coin.images ?? {}) },
  };
}

/** Map form values into a Coin patch ready for addCoin / updateCoin. */
export function formValuesToCoinPatch(
  v: CoinFormValues,
  forceStatus?: CoinStatus,
): Omit<CoinWithQuantity, "id" | "accessionNo" | "createdAt" | "updatedAt"> {
  const country = trim(v.country);
  const denomination = trim(v.denomination);
  const yearRaw = trim(v.yearText);
  const yearNum = /^\d{1,4}$/.test(yearRaw) ? parseInt(yearRaw, 10) : undefined;
  const era = yearNum === undefined ? opt(yearRaw) : undefined;
  const when = yearNum != null ? String(yearNum) : era;
  const title = `${country} ${denomination}${when ? ` ${when}` : ""}`.trim() || "Untitled entry";

  const status = forceStatus ?? v.status;
  const catalogRefs: CatalogRef[] = v.catalogRefs
    .map((r) => ({ system: trim(r.system), code: trim(r.code) }))
    .filter((r) => r.system !== "" || r.code !== "")
    .map((r) => ({ system: r.system || "Other", code: r.code }));
  const sources: CoinSource[] = v.sources
    .map((s) => ({ label: trim(s.label), url: trim(s.url) }))
    .filter((s) => s.label !== "" || s.url !== "")
    .map((s) => ({ label: s.label || s.url, url: s.url }));

  const images: CoinImages = {};
  if (v.images.obverse) images.obverse = v.images.obverse;
  if (v.images.reverse) images.reverse = v.images.reverse;
  if (v.images.edge) images.edge = v.images.edge;

  return {
    title,
    country,
    denomination,
    issuer: opt(v.issuer),
    currency: opt(v.currency),
    year: yearNum,
    era,
    mint: opt(v.mint),
    mintMark: opt(v.mintMark)?.toUpperCase(),
    composition: opt(v.composition),
    weightG: num(v.weightG),
    diameterMm: num(v.diameterMm),
    thicknessMm: num(v.thicknessMm),
    shape: opt(v.shape),
    edge: opt(v.edge),
    obverseDesc: joinDesc(v.obverseDesc, v.obverseLettering),
    reverseDesc: joinDesc(v.reverseDesc, v.reverseLettering),
    designer: opt(v.designer),
    engraver: opt(v.engraver),
    mintage: num(v.mintage),
    catalogRefs,
    grade: opt(v.grade),
    confidence: status === "pending" ? num(v.confidence) : undefined,
    status,
    acquiredDate: opt(v.acquiredDate),
    acquiredFrom: opt(v.acquiredFrom),
    pricePaid: num(v.pricePaid),
    estimatedValue: num(v.estimatedValue),
    storageLocation: opt(v.storageLocation),
    quantity: num(v.quantity),
    notes: opt(v.notes),
    tags: v.tags.map((t) => t.trim()).filter(Boolean),
    images,
    sources,
  };
}

/** Fields counted by the "catalogue completeness" meter (add-edit.md). */
export const COMPLETENESS_FIELDS: (keyof CoinFormValues)[] = [
  "country", "issuer", "denomination", "currency", "yearText", "mint", "mintMark",
  "composition", "weightG", "diameterMm", "thicknessMm", "shape", "edge",
  "obverseDesc", "reverseDesc", "designer", "mintage", "grade",
  "acquiredDate", "pricePaid", "storageLocation", "notes",
];

export function isFieldFilled(v: CoinFormValues, key: keyof CoinFormValues): boolean {
  const val = v[key];
  if (typeof val === "string") return val.trim() !== "";
  if (Array.isArray(val)) return val.length > 0;
  if (key === "images") return Boolean(v.images.obverse || v.images.reverse || v.images.edge);
  return Boolean(val);
}

export function countFilled(v: CoinFormValues, keys: (keyof CoinFormValues)[]): number {
  return keys.filter((k) => isFieldFilled(v, k)).length;
}

/* ------------------------------ option lists ---------------------------- */

/** ~60 common/historical issuing countries (add-edit.md §01). */
export const COUNTRY_SUGGESTIONS: string[] = [
  "Argentina", "Australia", "Austria", "Austria-Hungary", "Belgium", "Bolivia",
  "Brazil", "Bulgaria", "Canada", "Chile", "China", "China — Empire", "Colombia",
  "Cuba", "Czechoslovakia", "Czech Republic", "Denmark", "East Germany (DDR)",
  "Egypt", "Finland", "France", "German States — Bavaria", "German States — Prussia",
  "German States — Saxony", "Germany", "Germany — Empire", "Germany — Weimar Republic",
  "Greece", "Hong Kong", "Hungary", "India", "India — British", "Indonesia",
  "Ireland", "Israel", "Italy", "Italian States — Papal States", "Japan", "Mexico",
  "Morocco", "Netherlands", "New Zealand", "Norway", "Ottoman Empire", "Peru",
  "Philippines", "Poland", "Portugal", "Roman Empire", "Romania", "Russia — Empire",
  "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Turkey",
  "USSR (Soviet Union)", "United Kingdom", "United States", "Vatican City",
  "Venezuela", "Yugoslavia",
];

export const CURRENCY_SUGGESTIONS = [
  "EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "INR", "RUB",
  "BRL", "MXN", "SEK", "NOK", "DKK", "PLN", "historic / other",
];

export const COMPOSITION_SUGGESTIONS = [
  "Silver .999", "Silver .925 (sterling)", "Silver .900", "Silver .835", "Silver .500",
  "Gold .999", "Gold .917 (22k)", "Gold .900",
  "Copper", "Bronze", "Brass", "Copper-nickel", "Nickel", "Nickel-brass",
  "Aluminium", "Aluminium-bronze", "Stainless steel", "Zinc", "Billon",
  "Bimetallic: CuNi centre / Ni-brass ring", "Bimetallic: Ni-brass centre / CuNi ring",
];

export const SHAPE_OPTIONS = ["Round", "Scalloped", "Square", "Polygonal", "Holed", "Other"];
export const EDGE_OPTIONS = ["Reeded", "Smooth", "Lettered", "Interrupted reeding", "Other"];

export const REF_SYSTEM_SUGGESTIONS = [
  "KM", "Y", "N#", "Schön", "Seaby", "RIC", "RSC", "Gadoury", "Freeman", "Fr", "VAM", "Other",
];

export const GRADE_SUGGESTIONS = [
  "G4", "VG8", "F12", "F15", "VF20", "VF25", "VF30", "VF35", "EF40", "EF45",
  "AU50", "AU55", "AU58", "MS60", "MS61", "MS62", "MS63", "MS64", "MS65", "MS66",
  "MS67", "MS68", "MS69", "MS70",
  "G", "VG", "F", "VF", "EF", "AU", "UNC", "Proof",
];

/* --------------------------- image compression -------------------------- */

/**
 * Compress an image file to a JPEG data URL (max 1024px, quality 0.82) —
 * the photo contract for the catalogue form (add-edit.md §05).
 */
export function compressImageFile(file: File, maxPx = 1024, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.fillStyle = "#131009";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

/* ------------------------- minimal markdown render ---------------------- */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Tiny safe markdown subset for the notes preview (headings, bold, italic,
 *  code, links, lists, paragraphs). No external dependency. */
export function renderMarkdown(src: string): string {
  const lines = escapeHtml(src).split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  const inline = (s: string) =>
    s
      .replace(/`([^`]+)`/g, '<code class="rounded bg-bg-inset px-1 py-0.5 font-mono text-[0.85em] text-brass">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-brass underline underline-offset-2">$1</a>');
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^#{1,3}\s/.test(line)) {
      if (inList) { out.push("</ul>"); inList = false; }
      const level = line.match(/^(#{1,3})/)![1].length;
      const size = level === 1 ? "text-[19px]" : level === 2 ? "text-[17px]" : "text-[15px]";
      out.push(`<p class="mt-3 font-display font-semibold ${size} text-ink">${inline(line.replace(/^#{1,3}\s+/, ""))}</p>`);
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList) { out.push('<ul class="mt-1 list-disc space-y-1 pl-5">'); inList = true; }
      out.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
    } else if (line.trim() === "") {
      if (inList) { out.push("</ul>"); inList = false; }
    } else {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<p class="mt-2">${inline(line)}</p>`);
    }
  }
  if (inList) out.push("</ul>");
  return out.join("");
}
