import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { clearAllCoins } from "@/lib/db";
import { useCoinCount } from "@/hooks/useCoins";
import { Button } from "@/components/ui/button";
import { SettingsCard, TypedConfirmDialog } from "@/components/settings/SettingsShared";

/** Danger zone (settings.md §06): oxblood card, type-to-confirm erase. */
export default function DangerZoneSection() {
  const count = useCoinCount();
  const [clearOpen, setClearOpen] = useState(false);

  const doClearAll = async () => {
    try {
      const n = await clearAllCoins();
      toast.success(`Cleared ${n} entries`, {
        description: "The cabinet is empty. Any exports you made still work.",
      });
    } catch (err) {
      toast.error("Could not clear the collection", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <SettingsCard danger>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[56ch]">
          <div className="flex items-center gap-3">
            <Trash2 className="size-5 text-oxblood" aria-hidden />
            <h3 className="font-display text-[18px] font-medium text-ink">Erase entire collection</h3>
          </div>
          <p className="mt-2 font-serif text-[14.5px] leading-[1.6] text-ink-dim">
            Removes every entry in the cabinet
            {count != null ? ` — all ${count} of them` : ""}, including photos, tags and
            provenance notes. This cannot be undone.{" "}
            <span className="text-ink">Export first if you are unsure.</span>
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setClearOpen(true)}
          className="font-mono text-[12px] uppercase tracking-[0.12em]"
        >
          Clear all data
        </Button>
      </div>

      <TypedConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Erase the entire collection?"
        body={
          <>
            Every entry, photo and note will be permanently removed from this browser. There is no
            undo.{" "}
            <Link to="/settings" onClick={() => setClearOpen(false)} className="text-brass underline underline-offset-2">
              Export a backup first
            </Link>{" "}
            if you might want it back.
          </>
        }
        word="ERASE"
        confirmLabel="Erase everything"
        onConfirm={() => void doClearAll()}
      />
    </SettingsCard>
  );
}
