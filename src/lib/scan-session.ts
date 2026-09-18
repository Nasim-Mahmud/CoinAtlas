/**
 * Scan session handoff (Scan → Identify → Add contract).
 * Holds the current scan's captured photos (compressed JPEG data-URL strings)
 * in memory with a sessionStorage fallback so a mid-flow refresh or
 * navigation away and back can resume. Nothing leaves the device.
 */

export interface ScanSession {
  /** Captured obverse photo — compressed data-URL (max 1024px JPEG q0.82). */
  obverse?: string;
  /** Captured reverse photo (optional — reverse step may be skipped). */
  reverse?: string;
  /** Epoch ms of the last update. */
  savedAt: number;
}

const STORAGE_KEY = "numisma:scan-session";

/** In-memory copy — survives SPA navigation even if storage is blocked. */
let memorySession: ScanSession | null = null;

/** Persist the current scan session. Never throws. */
export function saveScanSession(session: { obverse?: string; reverse?: string }): void {
  const next: ScanSession = {
    obverse: session.obverse,
    reverse: session.reverse,
    savedAt: Date.now(),
  };
  memorySession = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage full/blocked — memory copy still works */
  }
}

/** Load the current scan session, or null when none exists. Never throws. */
export function loadScanSession(): ScanSession | null {
  if (memorySession && (memorySession.obverse || memorySession.reverse)) return memorySession;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScanSession;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.obverse && !parsed.reverse) return null;
    memorySession = parsed;
    return parsed;
  } catch {
    return null;
  }
}

/** Discard the current scan session. Never throws. */
export function clearScanSession(): void {
  memorySession = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
