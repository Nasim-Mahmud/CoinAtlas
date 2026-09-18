import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Coin } from "@/types/coin";
import { formatDiameter, formatNumber, formatThickness, formatWeight } from "@/lib/format";
import { DefinitionList, DefinitionRow } from "@/components/DefinitionRow";
import CatalogRefChips from "@/components/coin/CatalogRefChips";
import { Reveal, RevealItem } from "@/components/Reveal";

/**
 * Section 2 — the full catalogue record (coin-detail.md): two-column
 * definition grid with identity / physical / people / references groups.
 * Missing fields render as "—" with an inline "Add" ghost link on hover
 * deep-linking to the edit form group.
 */

function Missing({ to }: { to: string }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="font-serif italic text-ink-faint">—</span>
      <Link
        to={to}
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-brass opacity-0 transition-opacity hover:underline focus-visible:opacity-100 group-hover:opacity-100"
      >
        Add
      </Link>
    </span>
  );
}

function Group({ title }: { title: string }) {
  return (
    <div className="mb-1 mt-6 flex items-center gap-3 first:mt-0">
      <span aria-hidden className="h-px w-4 bg-brass" />
      <span className="overline-label">{title}</span>
    </div>
  );
}

export default function SpecRecord({ coin }: { coin: Coin }) {
  const edit = (anchor: string) => `/edit/${coin.id}#${anchor}`;
  const countryValue = coin.issuer ? `${coin.country} (${coin.issuer})` : coin.country || undefined;
  const yearValue = coin.year != null ? String(coin.year) : coin.era;

  return (
    <div className="grid gap-x-16 md:grid-cols-2">
      {/* left column */}
      <Reveal>
        <RevealItem>
          <Group title="Identity" />
          <DefinitionList>
            <DefinitionRow label="Country / Issuer" value={countryValue ?? <Missing to={edit("identity")} />} copyValue={countryValue} />
            <DefinitionRow label="Denomination" value={coin.denomination || <Missing to={edit("identity")} />} />
            <DefinitionRow label="Currency" value={coin.currency ?? <Missing to={edit("identity")} />} copyValue={coin.currency} />
            <DefinitionRow label="Year / Era" value={yearValue ?? <Missing to={edit("identity")} />} copyValue={yearValue} />
            <DefinitionRow label="Mint" value={coin.mint ?? <Missing to={edit("identity")} />} copyValue={coin.mint} />
            <DefinitionRow label="Mint Mark" value={coin.mintMark ?? <Missing to={edit("identity")} />} copyValue={coin.mintMark} />
          </DefinitionList>
        </RevealItem>
        <RevealItem>
          <Group title="People & Production" />
          <DefinitionList>
            <DefinitionRow label="Designer" value={coin.designer ?? <Missing to={edit("people")} />} copyValue={coin.designer} />
            <DefinitionRow label="Engraver" value={coin.engraver ?? <Missing to={edit("people")} />} copyValue={coin.engraver} />
            <DefinitionRow
              label="Mintage"
              value={coin.mintage != null ? formatNumber(coin.mintage) : <Missing to={edit("people")} />}
              copyValue={coin.mintage != null ? String(coin.mintage) : undefined}
            />
          </DefinitionList>
        </RevealItem>
      </Reveal>

      {/* right column */}
      <Reveal>
        <RevealItem>
          <Group title="Physical" />
          <DefinitionList>
            <DefinitionRow label="Composition" value={coin.composition ?? <Missing to={edit("physical")} />} copyValue={coin.composition} />
            <DefinitionRow
              label="Weight"
              value={coin.weightG != null ? formatWeight(coin.weightG) : <Missing to={edit("physical")} />}
              copyValue={coin.weightG != null ? formatWeight(coin.weightG) : undefined}
            />
            <DefinitionRow
              label="Diameter"
              value={coin.diameterMm != null ? formatDiameter(coin.diameterMm) : <Missing to={edit("physical")} />}
              copyValue={coin.diameterMm != null ? formatDiameter(coin.diameterMm) : undefined}
            />
            <DefinitionRow
              label="Thickness"
              value={coin.thicknessMm != null ? formatThickness(coin.thicknessMm) : <Missing to={edit("physical")} />}
              copyValue={coin.thicknessMm != null ? formatThickness(coin.thicknessMm) : undefined}
            />
            <DefinitionRow label="Shape" value={coin.shape ?? <Missing to={edit("physical")} />} copyValue={coin.shape} />
            <DefinitionRow label="Edge" value={coin.edge ?? <Missing to={edit("physical")} />} copyValue={coin.edge} />
          </DefinitionList>
        </RevealItem>
        <RevealItem>
          <Group title="Catalogue References" />
          <motion.div className="border-b border-line/50 py-3">
            {coin.catalogRefs.length > 0 ? (
              <CatalogRefChips refs={coin.catalogRefs} />
            ) : (
              <Missing to={edit("references")} />
            )}
          </motion.div>
        </RevealItem>
      </Reveal>
    </div>
  );
}
