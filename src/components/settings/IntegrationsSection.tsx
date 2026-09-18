import { useEffect, useState } from "react";
import { ExternalLink, Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsCard } from "@/components/settings/SettingsShared";

const KEY_STORAGE = "numista:apiKey";

/**
 * Integrations (settings.md §03): optional Numista API key.
 * OFF by default; stored ONLY in localStorage["numista:apiKey"], never
 * transmitted by the app itself. Core features need no keys.
 */
export default function IntegrationsSection() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const existing = window.localStorage.getItem(KEY_STORAGE);
      if (existing) {
        setKey(existing);
        setSaved(true);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  const save = () => {
    const k = key.trim();
    if (!k) return;
    try {
      window.localStorage.setItem(KEY_STORAGE, k);
      setSaved(true);
      toast.success("Numista API key saved", {
        description: "Stored on this device only — never transmitted by Numisma.",
      });
    } catch {
      toast.error("Could not store the key in this browser.");
    }
  };

  const clear = () => {
    try {
      window.localStorage.removeItem(KEY_STORAGE);
    } catch {
      /* non-fatal */
    }
    setKey("");
    setSaved(false);
    toast.success("Numista API key removed");
  };

  return (
    <SettingsCard>
      <div className="flex items-center gap-3">
        <KeyRound className="size-5 text-brass" aria-hidden />
        <h3 className="font-display text-[18px] font-medium text-ink">Numista API — optional</h3>
        <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
          Off by default
        </span>
      </div>
      <p className="mt-2 max-w-[62ch] font-serif text-[14.5px] leading-[1.6] text-ink-dim">
        Add your free Numista API key to enrich identification with live catalogue data.{" "}
        <span className="text-ink">Numisma works fully without it</span> — scanning, cataloguing,
        stats and export need no keys and no account. The key is stored only in this browser and is
        never transmitted by us; it is used solely if you choose to run Numista lookups.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
          <Input
            type={visible ? "text" : "password"}
            value={key}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setKey(e.target.value);
              setSaved(false);
            }}
            placeholder="Paste your API key"
            aria-label="Numista API key"
            className="bg-bg-inset pr-10 font-mono text-[13px]"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide API key" : "Show API key"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-ink-faint transition-colors hover:text-ink"
          >
            {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={save}
          disabled={key.trim() === "" || saved}
          className="border-line bg-bg-raised font-mono text-[12px] uppercase tracking-[0.1em] hover:border-line-strong"
        >
          {saved ? "Saved" : "Save key"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={clear}
          disabled={key === "" && !saved}
          className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink-dim"
        >
          Clear
        </Button>
      </div>

      <a
        href="https://en.numista.com/api"
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-brass underline-offset-2 hover:underline"
      >
        Get a free key at numista.com
        <ExternalLink className="size-3" aria-hidden />
      </a>
    </SettingsCard>
  );
}
