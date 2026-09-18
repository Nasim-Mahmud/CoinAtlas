import { useParams } from "react-router-dom";
import { useCoins } from "@/hooks/useCoins";
import CoinForm from "@/components/form/CoinForm";
import { coinToFormValues } from "@/components/form/form-utils";
import EmptyState from "@/components/EmptyState";

/**
 * /edit/:id — same catalogue form, preloaded from the collection.
 * Unknown id → empty state (add-edit.md).
 */
export default function EditCoin() {
  const { id } = useParams<{ id: string }>();
  const coins = useCoins();
  const coin = coins?.find((c) => c.id === id);

  if (coins === undefined) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-24 text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-faint">
          Opening the drawer…
        </p>
      </div>
    );
  }

  if (!coin) {
    return (
      <EmptyState
        headline="This drawer is empty"
        body="No entry with that accession record exists — it may have been removed from the collection."
        cta={{ label: "Back to collection", to: "/collection" }}
        secondaryCta={{ label: "Catalogue a coin", to: "/add" }}
      />
    );
  }

  return <CoinForm mode="edit" initialValues={coinToFormValues(coin)} existingCoin={coin} />;
}
