import { useSyncExternalStore } from "react";

/**
 * Tiny global store for the ⌘K command palette — no dependency, just a
 * module-level event emitter. Any component can call `openPalette()`.
 */

type Listener = () => void;

let open = false;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function openPalette(): void {
  if (!open) {
    open = true;
    emit();
  }
}

export function closePalette(): void {
  if (open) {
    open = false;
    emit();
  }
}

export function setPaletteOpen(next: boolean): void {
  if (next !== open) {
    open = next;
    emit();
  }
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  return open;
}

/** React binding for the palette's open state. */
export function usePaletteOpen(): [boolean, (next: boolean) => void] {
  const isOpen = useSyncExternalStore(subscribe, getSnapshot);
  return [isOpen, setPaletteOpen];
}
