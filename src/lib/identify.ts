/**
 * NUMISMA on-device identification (design: identify.md).
 *
 * An honest, fully client-side matcher — no network, no keys, no paid APIs.
 * For every reference photo and the user's capture we compute, on an
 * offscreen canvas:
 *   · a 16×16 average-hash (256 bits) over the luminance plane — captures the
 *     coarse relief / portrait layout;
 *   · a coarse 4×4×4 RGB histogram — captures metal tone & patina.
 * Similarity = weighted hamming similarity + histogram intersection, mapped
 * to a conservative 0–100 confidence (capped at 92; below 35 is "low").
 *
 * Reference corpus = the 12 bundled seed coins (buildSeedCoins, same-origin
 * /coins/*.jpg) PLUS the user's own collection images. Cross-origin images
 * are never touched (they would taint the canvas); every per-image unit of
 * work is wrapped in try/catch so one bad image never sinks a match run.
 *
 * Providers are pluggable: implement IdentificationProvider and pass it to
 * runIdentification() — e.g. a future Numista text-search provider.
 */

import type { Coin } from "@/types/coin";
import { asset } from "@/lib/asset";

/* ------------------------------------------------------------------ types */

export type CandidateSource = "reference" | "collection";

export interface Candidate {
  /** The catalogue entry the matcher proposes. */
  coin: Coin;
  /** 0–100, conservatively calibrated. */
  confidence: number;
  /** Where the candidate came from. */
  source: CandidateSource;
  /** Honest, human-readable "why" chips. */
  reasons: string[];
}

export interface IdentificationInput {
  /** User's captured obverse (data URL). */
  obverse?: string;
  /** User's captured reverse (data URL). */
  reverse?: string;
}

export interface IdentificationProvider {
  id: string;
  name: string;
  identify(input: IdentificationInput): Promise<Candidate[]>;
}

/* --------------------------------------------------------- image features */

const HASH_SIZE = 16; // 16×16 = 256-bit average hash
const HIST_BINS = 4; // per channel → 64-bin RGB histogram
const SAMPLE_SIZE = 48; // downscaled working size for pixels

interface ImageFeatures {
  hash: Uint8Array; // 32 bytes = 256 bits
  hist: Float32Array; // 64 bins, normalised to sum 1
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Same-origin only — data URLs and /coins/* paths need no CORS mode.
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src.slice(0, 48)}…`));
    img.src = asset(src);
  });
}

/**
 * Compute the aHash + colour histogram for one image. Throws if the image
 * cannot be decoded or the canvas is tainted — callers must catch.
 */
export async function computeImageFeatures(src: string): Promise<ImageFeatures> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE); // throws if tainted

  const px = SAMPLE_SIZE * SAMPLE_SIZE;
  const lum = new Float32Array(px);
  const hist = new Float32Array(HIST_BINS * HIST_BINS * HIST_BINS);
  for (let i = 0; i < px; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    lum[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const ri = Math.min(HIST_BINS - 1, r >> (8 - 2));
    const gi = Math.min(HIST_BINS - 1, g >> (8 - 2));
    const bi = Math.min(HIST_BINS - 1, b >> (8 - 2));
    hist[ri * HIST_BINS * HIST_BINS + gi * HIST_BINS + bi] += 1;
  }
  for (let i = 0; i < hist.length; i++) hist[i] /= px;

  // 16×16 average hash: downsample the luminance plane by block-averaging.
  const block = SAMPLE_SIZE / HASH_SIZE; // 3
  const cells = new Float32Array(HASH_SIZE * HASH_SIZE);
  for (let cy = 0; cy < HASH_SIZE; cy++) {
    for (let cx = 0; cx < HASH_SIZE; cx++) {
      let sum = 0;
      for (let y = 0; y < block; y++) {
        for (let x = 0; x < block; x++) {
          sum += lum[(cy * block + y) * SAMPLE_SIZE + (cx * block + x)];
        }
      }
      cells[cy * HASH_SIZE + cx] = sum / (block * block);
    }
  }
  let mean = 0;
  for (let i = 0; i < cells.length; i++) mean += cells[i];
  mean /= cells.length;
  const hash = new Uint8Array((HASH_SIZE * HASH_SIZE) / 8);
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] >= mean) hash[i >> 3] |= 1 << (i & 7);
  }
  return { hash, hist };
}

/* ------------------------------------------------------------- similarity */

function hammingSimilarity(a: Uint8Array, b: Uint8Array): number {
  let same = 0;
  for (let i = 0; i < a.length; i++) {
    let x = a[i] ^ b[i];
    // count differing bits
    let diff = 0;
    while (x) {
      diff += x & 1;
      x >>= 1;
    }
    same += 8 - diff;
  }
  return same / (a.length * 8);
}

function histogramIntersection(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.min(a[i], b[i]);
  return sum; // 0–1
}

interface SideScore {
  raw: number;
  hashSim: number;
  histSim: number;
}

function scorePair(a: ImageFeatures, b: ImageFeatures): SideScore {
  const hashSim = hammingSimilarity(a.hash, b.hash);
  const histSim = histogramIntersection(a.hist, b.hist);
  return { raw: 0.65 * hashSim + 0.35 * histSim, hashSim, histSim };
}

/**
 * Calibrated mapping: aHash on downscaled coin photos clusters around ~0.5
 * for unrelated coins and approaches 1.0 for true matches. Stretch the
 * useful band and cap at 92 — the UI never claims certainty.
 */
export function calibrateConfidence(raw: number): number {
  const c = Math.round((raw - 0.5) * 200);
  return Math.max(0, Math.min(92, c));
}

export const LOW_CONFIDENCE_THRESHOLD = 35;

function buildReasons(obv: SideScore | null, rev: SideScore | null): string[] {
  const reasons: string[] = [];
  const best = obv ?? rev;
  if (best && best.hashSim >= 0.78) reasons.push("Relief / portrait pattern");
  if (best && best.histSim >= 0.72) reasons.push("Metal tone & colour");
  if (obv && rev && obv.raw >= 0.62 && rev.raw >= 0.62) reasons.push("Obverse + reverse agree");
  else if (rev) reasons.push("Reverse-side match");
  if (reasons.length === 0) reasons.push("Broad visual similarity");
  return reasons;
}

/* ----------------------------------------------------------- local corpus */

export interface ReferenceEntry {
  coin: Coin;
  source: CandidateSource;
  obverseSrc?: string;
  reverseSrc?: string;
}

/**
 * Build the match corpus: the bundled 12-coin reference set plus the user's
 * own collection (deduplicated by id — the seeds live in both).
 */
export function buildReferenceEntries(referencePack: Coin[], collection: Coin[]): ReferenceEntry[] {
  const entries: ReferenceEntry[] = [];
  const seen = new Set<string>();
  for (const coin of referencePack) {
    seen.add(coin.id);
    entries.push({
      coin,
      source: "reference",
      obverseSrc: coin.images.obverse,
      reverseSrc: coin.images.reverse,
    });
  }
  for (const coin of collection) {
    if (seen.has(coin.id)) continue;
    if (!coin.images.obverse && !coin.images.reverse) continue;
    entries.push({
      coin,
      source: "collection",
      obverseSrc: coin.images.obverse,
      reverseSrc: coin.images.reverse,
    });
  }
  return entries;
}

/** The default, fully offline provider: on-device perceptual matching. */
export function createLocalProvider(entries: ReferenceEntry[]): IdentificationProvider {
  return {
    id: "local-ahash",
    name: "On-device visual match",
    async identify(input) {
      // Features of the user's capture(s).
      let obvFeat: ImageFeatures | null = null;
      let revFeat: ImageFeatures | null = null;
      try {
        if (input.obverse) obvFeat = await computeImageFeatures(input.obverse);
      } catch {
        obvFeat = null;
      }
      try {
        if (input.reverse) revFeat = await computeImageFeatures(input.reverse);
      } catch {
        revFeat = null;
      }
      if (!obvFeat && !revFeat) return [];

      const candidates: Candidate[] = [];
      for (const entry of entries) {
        try {
          let obv: SideScore | null = null;
          let rev: SideScore | null = null;
          if (obvFeat && entry.obverseSrc) {
            obv = scorePair(obvFeat, await computeImageFeatures(entry.obverseSrc));
          }
          if (revFeat && entry.reverseSrc) {
            rev = scorePair(revFeat, await computeImageFeatures(entry.reverseSrc));
          }
          if (!obv && !rev) continue;
          // When we have both sides of both, weigh them together; a
          // single-sided comparison stands on its own.
          const raw =
            obv && rev ? 0.55 * obv.raw + 0.45 * rev.raw + 0.03 : (obv ?? rev)!.raw;
          const confidence = calibrateConfidence(raw);
          if (confidence < 12) continue; // noise floor
          candidates.push({
            coin: entry.coin,
            confidence,
            source: entry.source,
            reasons: buildReasons(obv, rev),
          });
        } catch {
          /* one bad reference image never sinks the run */
        }
      }
      candidates.sort((a, b) => b.confidence - a.confidence);
      return candidates.slice(0, 5);
    },
  };
}

/**
 * Run providers in order and merge their candidates (highest confidence per
 * coin id wins; provider failures degrade to the remaining providers).
 */
export async function runIdentification(
  providers: IdentificationProvider[],
  input: IdentificationInput,
): Promise<Candidate[]> {
  const byId = new Map<string, Candidate>();
  for (const provider of providers) {
    try {
      const results = await provider.identify(input);
      for (const c of results) {
        const existing = byId.get(c.coin.id);
        if (!existing || c.confidence > existing.confidence) byId.set(c.coin.id, c);
      }
    } catch {
      /* provider failed — identification must never be a dead end */
    }
  }
  return [...byId.values()].sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}
