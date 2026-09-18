import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ScanSearch } from "lucide-react";
import { toast } from "sonner";
import type { Coin } from "@/types/coin";
import { updateCoin } from "@/hooks/useCoins";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import ConfidenceBar from "@/components/coin/ConfidenceBar";
import { Switch } from "@/components/ui/switch";

/**
 * Section 5 — identification provenance (coin-detail.md): attribution
 * timeline, confidence bar, and the "Mark verified" toggle.
 */

interface Event {
  label: string;
  detail?: string;
  tone: "patina" | "copper";
}

export default function ProvenancePanel({ coin }: { coin: Coin }) {
  const verified = coin.status === "verified";

  const events: Event[] = [];
  if (coin.confidence != null) {
    events.push({
      label: `Scanned · ${formatDate(coin.createdAt)}`,
      detail:
        coin.images.obverse && coin.images.reverse
          ? "Obverse + reverse captured"
          : "Photographs captured",
      tone: "patina",
    });
    events.push({
      label: "Identified",
      detail: `Candidate accepted — confidence ${Math.round(coin.confidence)}%`,
      tone: "patina",
    });
  }
  if (verified) {
    events.push({
      label: `Confirmed by you · ${formatDate(coin.updatedAt)}`,
      detail: "Attribution verified against the catalogue record",
      tone: "patina",
    });
  } else if (coin.confidence != null) {
    events.push({
      label: "Awaiting review",
      detail: "Confirm or correct the identification",
      tone: "copper",
    });
  }

  const toggleVerified = async (next: boolean) => {
    const updated = await updateCoin(coin.id, { status: next ? "verified" : "pending" });
    if (updated) {
      toast.success(next ? "Marked verified" : "Returned to pending review", {
        description: coin.title,
      });
    }
  };

  return (
    <div className="rounded-[12px] border border-line bg-inset p-6">
      {events.length > 0 ? (
        <ol className="relative ml-1 space-y-5 border-l border-line pl-6">
          {events.map((e, i) => (
            <motion.li
              key={e.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="relative"
            >
              <span
                aria-hidden
                className={cn(
                  "absolute -left-[27.5px] top-1 size-2.5 rounded-full",
                  e.tone === "patina" ? "bg-patina" : "bg-copper",
                )}
              />
              <div className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink">{e.label}</div>
              {e.detail && <div className="mt-0.5 font-mono text-[12px] text-ink-dim">{e.detail}</div>}
              {e.label === "Awaiting review" && (
                <Link
                  to={`/identify?coin=${coin.id}`}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-copper/50 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-copper transition-colors hover:bg-copper/10"
                >
                  <ScanSearch className="size-3.5" />
                  Review identification →
                </Link>
              )}
            </motion.li>
          ))}
        </ol>
      ) : (
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink-dim">
          Manually catalogued · {formatDate(coin.createdAt)}
        </p>
      )}

      {coin.confidence != null && (
        <div className="mt-6">
          <div className="overline-label mb-2">Accepted score</div>
          <ConfidenceBar value={coin.confidence} showValue className="w-full" />
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-4">
        <div>
          <div className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink">
            {verified ? "Verified attribution" : "Mark verified"}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
            {verified ? "You have confirmed this record" : "Confirm this record matches the coin in hand"}
          </div>
        </div>
        <Switch
          checked={verified}
          onCheckedChange={(v) => void toggleVerified(v)}
          aria-label="Mark verified"
        />
      </div>
    </div>
  );
}
