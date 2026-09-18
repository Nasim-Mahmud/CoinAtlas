/**
 * Wraps case-insensitive query matches in a brass underline mark
 * (reference.md: search results highlight with brass underline marks).
 */
export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: { str: string; hit: boolean }[] = [];
  let i = 0;
  while (i < text.length) {
    const found = lower.indexOf(needle, i);
    if (found === -1) {
      parts.push({ str: text.slice(i), hit: false });
      break;
    }
    if (found > i) parts.push({ str: text.slice(i, found), hit: false });
    parts.push({ str: text.slice(found, found + needle.length), hit: true });
    i = found + needle.length;
  }
  return (
    <>
      {parts.map((p, idx) =>
        p.hit ? (
          <mark
            key={idx}
            className="bg-transparent text-brass underline decoration-brass/70 decoration-2 underline-offset-2"
          >
            {p.str}
          </mark>
        ) : (
          <span key={idx}>{p.str}</span>
        ),
      )}
    </>
  );
}

export function matchesQuery(query: string, ...fields: (string | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => f?.toLowerCase().includes(q));
}
