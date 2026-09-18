/**
 * Base-aware public-asset URL resolver.
 *
 * The app is deployed under a sub-path (GitHub Pages project site, e.g.
 * https://<user>.github.io/CoinAtlas/) with Vite `base: "./"`. Hard-coded
 * root-absolute paths like "/coins/x.jpg" escape that sub-path and 404 —
 * so every public asset goes through `asset()`, which prefixes
 * `import.meta.env.BASE_URL`. Data/blob/remote URLs pass through untouched,
 * and it also normalises legacy root-absolute paths stored in IndexedDB by
 * earlier versions.
 */
export function asset(p: string): string {
  if (!p) return p;
  if (/^(data:|blob:|https?:|mailto:)/i.test(p)) return p;
  const base = import.meta.env.BASE_URL || "/";
  const clean = p.replace(/^\/+/, "");
  return (base.endsWith("/") ? base : base + "/") + clean;
}
