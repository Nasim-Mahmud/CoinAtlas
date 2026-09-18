/**
 * On-capture photo processing (scan.md): crop a square around the alignment
 * guide, auto-contrast via a simple percentile histogram stretch, then emit a
 * compressed JPEG data URL (max 1024px, quality 0.82) — the exact format the
 * Add form stores in Coin.images. Also computes the review-step quality
 * heuristics (brightness & sharpness). Everything runs on Canvas 2D,
 * entirely on-device.
 */

export interface PhotoQuality {
  /** Mean luminance 0–255. */
  brightness: number;
  /** Laplacian-variance sharpness estimate (higher = sharper). */
  sharpness: number;
  /** True when the frame is likely underexposed. */
  tooDark: boolean;
  /** True when the frame is likely blurred / moved. */
  soft: boolean;
}

export interface ProcessedPhoto {
  dataUrl: string;
  quality: PhotoQuality;
}

const MAX_OUT = 1024;
const JPEG_QUALITY = 0.82;

/** Fraction of the frame's short edge that the guide ring spans. */
const GUIDE_FRACTION = 0.72;
/** Extra margin around the guide ring when cropping. */
const CROP_MARGIN = 1.16;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode photo"));
    img.src = src;
  });
}

/** Luminance + sharpness measured on a small downsample. */
export function measureQuality(source: HTMLImageElement | HTMLCanvasElement): PhotoQuality {
  const N = 64;
  const canvas = document.createElement("canvas");
  canvas.width = N;
  canvas.height = N;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { brightness: 128, sharpness: 100, tooDark: false, soft: false };
  ctx.drawImage(source, 0, 0, N, N);
  const { data } = ctx.getImageData(0, 0, N, N);

  const lum = new Float32Array(N * N);
  let sum = 0;
  for (let i = 0; i < N * N; i++) {
    lum[i] = 0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2];
    sum += lum[i];
  }
  const brightness = sum / (N * N);

  // Variance of the discrete Laplacian — classic blur estimator.
  let lapSum = 0;
  let lapSq = 0;
  let count = 0;
  for (let y = 1; y < N - 1; y++) {
    for (let x = 1; x < N - 1; x++) {
      const lap =
        4 * lum[y * N + x] - lum[y * N + x - 1] - lum[y * N + x + 1] - lum[(y - 1) * N + x] - lum[(y + 1) * N + x];
      lapSum += lap;
      lapSq += lap * lap;
      count++;
    }
  }
  const mean = lapSum / count;
  const sharpness = lapSq / count - mean * mean;

  return {
    brightness,
    sharpness,
    tooDark: brightness < 62,
    soft: sharpness < 55,
  };
}

/**
 * Crop around the centred guide circle, stretch contrast, compress.
 * `cropFraction` overrides the guide-based crop (uploads are usually already
 * framed, so they use a gentler crop).
 */
export async function processCoinPhoto(
  sourceDataUrl: string,
  options: { cropFraction?: number } = {},
): Promise<ProcessedPhoto> {
  const img = await loadImage(sourceDataUrl);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) throw new Error("Empty photo");

  const fraction = options.cropFraction ?? GUIDE_FRACTION * CROP_MARGIN;
  const side = Math.max(32, Math.round(Math.min(w, h) * Math.min(1, fraction)));
  const sx = Math.round((w - side) / 2);
  const sy = Math.round((h - side) / 2);
  const out = Math.min(MAX_OUT, side);

  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);

  // --- auto-contrast: percentile luminance stretch, applied uniformly to
  // all channels so the metal's colour balance is preserved.
  const imageData = ctx.getImageData(0, 0, out, out);
  const d = imageData.data;
  const hist = new Uint32Array(256);
  const px = out * out;
  for (let i = 0; i < px; i++) {
    const l = Math.round(0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]);
    hist[Math.min(255, l)]++;
  }
  let lo = 0;
  let hi = 255;
  let acc = 0;
  const loCut = px * 0.01;
  const hiCut = px * 0.99;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc >= loCut) {
      lo = i;
      break;
    }
  }
  acc = 0;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc >= hiCut) {
      hi = i;
      break;
    }
  }
  if (hi - lo > 24) {
    const scale = 255 / (hi - lo);
    for (let i = 0; i < px; i++) {
      for (let c = 0; c < 3; c++) {
        const idx = i * 4 + c;
        d[idx] = Math.max(0, Math.min(255, Math.round((d[idx] - lo) * scale)));
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  const quality = measureQuality(canvas);
  return { dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY), quality };
}

/** Read an uploaded image file and run it through the same pipeline. */
export async function processUploadedFile(file: File): Promise<ProcessedPhoto> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
  // Uploads are typically already framed on the coin — crop gently.
  return processCoinPhoto(raw, { cropFraction: 0.94 });
}
