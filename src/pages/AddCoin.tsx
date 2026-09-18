import { useLocation } from "react-router-dom";
import CoinForm from "@/components/form/CoinForm";
import { coinToFormValues } from "@/components/form/form-utils";
import type { CoinWithQuantity } from "@/components/form/form-utils";

/**
 * /add — the cataloguing desk (add-edit.md).
 *
 * Contract with the Scan/Identify flow: the Identify page navigates here
 * with router state `{ prefill: Partial<Coin> & { images?: { obverse?,
 * reverse? } } }` (images are JPEG data-URL strings ≤1024px). Every matching
 * field and photo is pre-populated; status defaults to "pending" with the
 * prefill's confidence when present.
 */
export default function AddCoin() {
  const location = useLocation();
  const prefill = (location.state as { prefill?: Partial<CoinWithQuantity> } | null)?.prefill;

  const initialValues = coinToFormValues({
    ...prefill,
    status: prefill ? (prefill.status ?? "pending") : "draft",
  });

  return (
    <CoinForm
      mode="add"
      initialValues={initialValues}
      fromIdentification={
        prefill ? { confidence: prefill.confidence } : undefined
      }
    />
  );
}
