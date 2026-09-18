import { useEffect, useRef, useState } from "react";
import { ArchiveRestore, Database, FileDown, FileUp, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { exportJSON, importJSON, restoreSeed } from "@/lib/db";
import { useCoinCount } from "@/hooks/useCoins";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, SettingsCard } from "@/components/settings/SettingsShared";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Data management (settings.md §04/§05): stats, export, import, seed restore. */
export default function DataSection() {
  const count = useCoinCount();
  const fileRef = useRef<HTMLInputElement>(null);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [seedConfirm, setSeedConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (navigator.storage?.estimate) {
      navigator.storage
        .estimate()
        .then((e) => {
          if (!cancelled && e.usage != null) setStorage({ usage: e.usage, quota: e.quota ?? 0 });
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [count]);

  const doExport = async () => {
    setExporting(true);
    try {
      const json = await exportJSON();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "numisma-collection.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${count ?? 0} entries`, {
        description: `numisma-collection.json · ${formatBytes(blob.size)}`,
      });
    } catch (err) {
      toast.error("Export failed", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setExporting(false);
    }
  };

  const doImport = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const result = await importJSON(text);
      if (result.total === 0) {
        toast.error("Nothing to import", {
          description: "That file does not look like a Numisma export.",
        });
      } else {
        toast.success(`Import complete — ${result.added} added · ${result.updated} updated`, {
          description: `${result.total} entries now in the cabinet.`,
        });
      }
    } catch (err) {
      toast.error("Import failed", {
        description: err instanceof Error ? err.message : "The file could not be parsed.",
      });
    } finally {
      setImporting(false);
    }
  };

  const doRestoreSeed = async () => {
    const n = await restoreSeed();
    toast.success(`Restored ${n} example entries`, {
      description: "The demo collection is back in the cabinet.",
    });
  };

  return (
    <>
      {/* Live stats */}
      <SettingsCard className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex items-center gap-3">
          <Database className="size-4 shrink-0 text-brass" aria-hidden />
          <p className="font-mono text-[13px] text-ink">
            {count === undefined ? "…" : `${count} ${count === 1 ? "entry" : "entries"}`}
            <span className="text-ink-faint"> in the cabinet</span>
          </p>
        </div>
        <p className="font-mono text-[12px] text-ink-faint">
          {storage
            ? `On-device storage ${formatBytes(storage.usage)}${storage.quota ? ` of ~${formatBytes(storage.quota)}` : ""} · IndexedDB`
            : "All data lives in this browser (IndexedDB)"}
        </p>
      </SettingsCard>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Export */}
        <SettingsCard>
          <div className="flex items-center gap-3">
            <FileDown className="size-5 text-brass" aria-hidden />
            <h3 className="font-display text-[18px] font-medium text-ink">Export collection</h3>
          </div>
          <p className="mt-2 font-serif text-[14.5px] leading-[1.6] text-ink-dim">
            Everything — entries, photos, catalogue references — as one JSON file you can archive
            or move to another device.
          </p>
          <Button
            type="button"
            onClick={() => void doExport()}
            disabled={exporting}
            className="mt-4 bg-brass font-mono text-[12px] uppercase tracking-[0.12em] text-[#131009] hover:bg-brass-bright"
          >
            {exporting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            Export JSON
          </Button>
        </SettingsCard>

        {/* Import */}
        <SettingsCard>
          <div className="flex items-center gap-3">
            <FileUp className="size-5 text-brass" aria-hidden />
            <h3 className="font-display text-[18px] font-medium text-ink">Import / restore</h3>
          </div>
          <p className="mt-2 font-serif text-[14.5px] leading-[1.6] text-ink-dim">
            Load a <span className="font-mono text-[13px]">numisma-collection.json</span> export.
            Entries merge by id — existing entries update, new ones are added.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void doImport(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="mt-4 border-line bg-bg-raised font-mono text-[12px] uppercase tracking-[0.12em] hover:border-line-strong"
          >
            {importing && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            Choose JSON file
          </Button>
        </SettingsCard>
      </div>

      {/* Example data */}
      <SettingsCard>
        <div className="flex items-center gap-3">
          <Sparkles className="size-5 text-brass" aria-hidden />
          <h3 className="font-display text-[18px] font-medium text-ink">Example data</h3>
        </div>
        <p className="mt-2 max-w-[62ch] font-serif text-[14.5px] leading-[1.6] text-ink-dim">
          The 12-piece example collection that ships with Numisma. Restore it to explore the
          cabinet, then clear it once your own coins take over.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSeedConfirm(true)}
            className="border-line bg-bg-raised font-mono text-[12px] uppercase tracking-[0.12em] hover:border-line-strong"
          >
            <ArchiveRestore className="size-3.5" aria-hidden />
            Restore demo seed
          </Button>
        </div>
      </SettingsCard>

      <ConfirmDialog
        open={seedConfirm}
        onOpenChange={setSeedConfirm}
        title="Restore the example collection?"
        body="The 12 demo entries will be written back into the cabinet. Entries with the same seed ids are overwritten; your own entries are untouched."
        confirmLabel="Restore examples"
        onConfirm={() => void doRestoreSeed()}
      />
    </>
  );
}
