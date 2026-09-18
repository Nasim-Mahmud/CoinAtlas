import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, Stamp } from "lucide-react";
import { toast } from "sonner";
import type { Coin, NewCoinInput } from "@/types/coin";
import { addCoin, updateCoin, useCoins } from "@/hooks/useCoins";
import { formatAccession } from "@/lib/coin-utils";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  coinFormSchema,
  formValuesToCoinPatch,
  coinToFormValues,
  countFilled,
  renderMarkdown,
  COUNTRY_SUGGESTIONS,
  CURRENCY_SUGGESTIONS,
  COMPOSITION_SUGGESTIONS,
  GRADE_SUGGESTIONS,
  SHAPE_OPTIONS,
  EDGE_OPTIONS,
} from "@/components/form/form-utils";
import type { CoinFormValues } from "@/components/form/form-utils";
import { ComboboxField, ChipSelect, FieldError, FieldLabel, TagEditor, UnitInput } from "@/components/form/fields";
import { CatalogRefEditor, SourcesEditor } from "@/components/form/RowBuilders";
import ImageSlots from "@/components/form/ImageSlots";
import LabelPreview from "@/components/form/LabelPreview";
import AccessionStamp from "@/components/form/AccessionStamp";

/**
 * Shared catalogue form for /add and /edit/:id (add-edit.md).
 * Grouped collapsible sections; everything optional — a blank save becomes
 * a draft entry. Soft duplicate detection, accession-stamp on create.
 */

type SectionId = "identity" | "physical" | "design" | "references" | "copy" | "photos" | "notes";

const SECTION_FIELDS: Record<SectionId, (keyof CoinFormValues)[]> = {
  identity: ["country", "issuer", "denomination", "currency", "yearText", "mint", "mintMark", "catalogRefs", "tags"],
  physical: ["composition", "weightG", "diameterMm", "thicknessMm", "shape", "edge"],
  design: ["obverseDesc", "reverseDesc", "designer", "engraver", "mintage"],
  references: ["catalogRefs", "sources"],
  copy: ["status", "grade", "quantity", "acquiredDate", "acquiredFrom", "pricePaid", "estimatedValue", "storageLocation"],
  photos: ["images"],
  notes: ["notes"],
};

const SECTION_TITLES: [SectionId, string][] = [
  ["identity", "Identity"],
  ["physical", "Physical specifications"],
  ["design", "Design & inscriptions"],
  ["references", "Catalogue references & sources"],
  ["copy", "My copy"],
  ["photos", "Photos"],
  ["notes", "Notes"],
];

const STATUS_OPTIONS = [
  { value: "verified", label: "Verified", active: "border-patina/60 bg-patina/10 text-patina" },
  { value: "pending", label: "Pending review", active: "border-copper/60 bg-copper/10 text-copper" },
  { value: "draft", label: "Draft", active: "border-ink-faint/60 bg-bg-inset text-ink-dim" },
] as const;

export interface CoinFormProps {
  mode: "add" | "edit";
  /** Pre-populated values (from /identify prefill or the loaded coin). */
  initialValues: CoinFormValues;
  /** Edit mode: the coin being edited (excluded from duplicate check). */
  existingCoin?: Coin;
  /** Set when arriving from /identify — shows the identification banner. */
  fromIdentification?: { confidence?: number };
}

export default function CoinForm({ mode, initialValues, existingCoin, fromIdentification }: CoinFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const coins = useCoins();

  const form = useForm<CoinFormValues>({
    resolver: zodResolver(coinFormSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });
  const { register, handleSubmit, watch, setValue, formState } = form;
  const values = watch();

  const [openSections, setOpenSections] = useState<SectionId[]>(["identity"]);
  const [dupeOpen, setDupeOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [notesPreview, setNotesPreview] = useState(false);
  const [stamp, setStamp] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const pendingPatch = useRef<NewCoinInput | null>(null);

  /* Deep-link: /edit/:id#physical scrolls to + opens the group. */
  useEffect(() => {
    const hash = location.hash.replace("#", "") as SectionId;
    if (SECTION_TITLES.some(([id]) => id === hash)) {
      setOpenSections((s) => (s.includes(hash) ? s : [...s, hash]));
      window.setTimeout(() => document.getElementById(`section-${hash}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Unsaved-changes guard (browser-level). */
  useEffect(() => {
    if (!formState.isDirty || stamp) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [formState.isDirty, stamp]);

  const countrySuggestions = useMemo(() => {
    const fromCollection = (coins ?? []).map((c) => c.country);
    return [...new Set([...fromCollection, ...COUNTRY_SUGGESTIONS])];
  }, [coins]);

  const tagSuggestions = useMemo(
    () => [...new Set((coins ?? []).flatMap((c) => c.tags))].sort(),
    [coins],
  );

  const sourceErrors = useMemo(() => {
    const errs = formState.errors.sources as unknown as
      | ({ url?: { message?: string } } | undefined)[]
      | undefined;
    return (errs ?? []).map((e) => ({ url: e?.url?.message }));
  }, [formState.errors.sources]);

  const nextAccession = useMemo(() => {
    if (mode === "edit" && existingCoin) return formatAccession(existingCoin.accessionNo);
    const max = (coins ?? []).reduce((m, c) => Math.max(m, c.accessionNo), 0);
    return formatAccession(max + 1);
  }, [coins, mode, existingCoin]);

  const findDuplicate = (patch: NewCoinInput): Coin | undefined =>
    (coins ?? []).find((c) => {
      if (existingCoin && c.id === existingCoin.id) return false;
      const sameText = (a?: string, b?: string) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();
      return (
        sameText(c.country, patch.country) &&
        sameText(c.denomination, patch.denomination) &&
        (c.year ?? null) === (patch.year ?? null) &&
        sameText(c.mint, patch.mint) &&
        sameText(c.era, patch.era)
      );
    });

  const doSave = async (patch: NewCoinInput) => {
    setSaving(true);
    try {
      if (mode === "add") {
        const coin = await addCoin(patch);
        setStamp(formatAccession(coin.accessionNo));
        window.setTimeout(() => navigate(`/coin/${coin.id}`), 1100);
      } else if (existingCoin) {
        await updateCoin(existingCoin.id, patch);
        toast.success("Entry updated", { description: formatAccession(existingCoin.accessionNo) });
        navigate(`/coin/${existingCoin.id}`);
      }
    } catch (err) {
      toast.error("Could not save the entry", {
        description: err instanceof Error ? err.message : undefined,
      });
      setSaving(false);
    }
  };

  const onValid = async (v: CoinFormValues, forceDraft: boolean) => {
    const patch = formValuesToCoinPatch(v, forceDraft ? "draft" : undefined) as NewCoinInput;
    if (!forceDraft) {
      const dupe = findDuplicate(patch);
      if (dupe) {
        pendingPatch.current = patch;
        setDupeOpen(true);
        return;
      }
    }
    await doSave(patch);
  };

  const onInvalid = () => {
    const first = Object.keys(formState.errors)[0];
    const section = (Object.keys(SECTION_FIELDS) as SectionId[]).find((s) =>
      SECTION_FIELDS[s].includes(first as keyof CoinFormValues),
    );
    if (section) setOpenSections((s) => (s.includes(section) ? s : [...s, section]));
    window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[name="${first}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }, 120);
    toast.error("Some fields need attention");
  };

  const saveAsDraft = () => void handleSubmit((v) => onValid(v, true), onInvalid)();
  const saveEntry = () => void handleSubmit((v) => onValid(v, false), onInvalid)();

  const cancel = () => {
    if (formState.isDirty && !stamp) setDiscardOpen(true);
    else navigate(-1);
  };

  const dupe = dupeOpen
    ? findDuplicate(formValuesToCoinPatch(values) as NewCoinInput)
    : undefined;

  const sectionShell = (
    id: SectionId,
    index: number,
    title: string,
    children: React.ReactNode,
    panel?: boolean,
  ) => {
    const filled = countFilled(values, SECTION_FIELDS[id]);
    const total = SECTION_FIELDS[id].length;
    return (
      <AccordionItem key={id} value={id} id={`section-${id}`} className="scroll-mt-24 border-b border-line">
        <AccordionTrigger className="group py-5 hover:no-underline">
          <div className="flex flex-1 items-baseline gap-4 text-left">
            <span className="overline-label shrink-0">
              {String(index + 1).padStart(2, "0")} · {title.split(" ")[0].toUpperCase()}
            </span>
            <span className="font-display text-[20px] font-medium text-ink">{title}</span>
            <span className="ml-auto font-mono text-[11px] text-ink-faint">
              {filled}/{total}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-8">
          {panel ? (
            <div className="rounded-[12px] border border-line bg-bg-raised p-6">{children}</div>
          ) : (
            children
          )}
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6">
      {/* ---- Page header ---- */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-10"
      >
        <div>
          <p className="overline-label">
            {mode === "add" ? `New entry · ${nextAccession}` : `Editing · ${nextAccession}`}
          </p>
          <h1 className="mt-2 font-display text-[28px] font-semibold tracking-[-0.015em] text-ink md:text-[34px]">
            {mode === "add" ? "Catalogue a coin" : "Edit entry"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={cancel} className="font-mono text-[12px] uppercase tracking-[0.12em]">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={saveEntry}
            disabled={saving}
            className="bg-brass font-mono text-[12px] uppercase tracking-[0.12em] text-[#131009] hover:bg-brass-bright"
          >
            {saving ? "Saving…" : "Save entry"}
          </Button>
        </div>
      </motion.header>

      {/* ---- Identification banner ---- */}
      {fromIdentification && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="mb-6 overflow-hidden"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-brass/40 bg-brass/10 p-3">
            <Stamp className="size-4 shrink-0 text-brass" aria-hidden />
            <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-brass">
              Prefilled from identification
              {fromIdentification.confidence != null && ` · ${Math.round(fromIdentification.confidence)}% confidence`}
              {" — review before saving"}
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
        {/* ---- Form ---- */}
        <form onSubmit={(e) => e.preventDefault()} noValidate>
          <Accordion
            type="multiple"
            value={openSections}
            onValueChange={(v) => setOpenSections(v as SectionId[])}
          >
            {sectionShell(
              "identity",
              0,
              "Identity",
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="f-country">Country</FieldLabel>
                  <ComboboxField
                    id="f-country"
                    value={values.country}
                    onChange={(v) => setValue("country", v, { shouldDirty: true })}
                    suggestions={countrySuggestions}
                    placeholder="France, Roman Empire…"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="f-issuer">Issuer / authority</FieldLabel>
                  <Input
                    id="f-issuer"
                    {...register("issuer")}
                    placeholder="Hadrian, Prussia, Banque de France…"
                    className="bg-bg-inset font-mono text-[14px]"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="f-denomination">Denomination</FieldLabel>
                  <Input
                    id="f-denomination"
                    {...register("denomination")}
                    placeholder="2 Euro, 1 Penny, Denarius…"
                    className="bg-bg-inset font-mono text-[14px]"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="f-currency">Currency</FieldLabel>
                  <ComboboxField
                    id="f-currency"
                    value={values.currency}
                    onChange={(v) => setValue("currency", v, { shouldDirty: true })}
                    suggestions={CURRENCY_SUGGESTIONS}
                    placeholder="EUR, USD…"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="f-year" hint="1999 · c. 117–138 AD">
                    Year or era
                  </FieldLabel>
                  <Input
                    id="f-year"
                    {...register("yearText")}
                    placeholder="1999 — or c. 117–138 AD"
                    className="bg-bg-inset font-mono text-[14px]"
                  />
                </div>
                <div className="grid grid-cols-[1fr_88px] gap-3">
                  <div>
                    <FieldLabel htmlFor="f-mint">Mint</FieldLabel>
                    <Input
                      id="f-mint"
                      {...register("mint")}
                      placeholder="Paris, Rome…"
                      className="bg-bg-inset font-mono text-[14px]"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="f-mintmark">Mark</FieldLabel>
                    <Input
                      id="f-mintmark"
                      {...register("mintMark")}
                      placeholder="S"
                      maxLength={6}
                      className="bg-bg-inset font-mono text-[14px] uppercase"
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                        register("mintMark").onChange(e);
                      }}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Catalogue references</FieldLabel>
                  <CatalogRefEditor
                    refs={values.catalogRefs}
                    onChange={(r) => setValue("catalogRefs", r, { shouldDirty: true })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="f-tags">Tags</FieldLabel>
                  <TagEditor
                    id="f-tags"
                    tags={values.tags}
                    onChange={(t) => setValue("tags", t, { shouldDirty: true })}
                    suggestions={tagSuggestions}
                  />
                </div>
              </div>,
            )}

            {sectionShell(
              "physical",
              1,
              "Physical specifications",
              <div className="grid gap-5">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <FieldLabel htmlFor="f-weight">Weight</FieldLabel>
                    <UnitInput id="f-weight" unit="g" placeholder="8.50" invalid={Boolean(formState.errors.weightG)} {...register("weightG")} />
                    <FieldError message={formState.errors.weightG?.message} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="f-diameter">Diameter</FieldLabel>
                    <UnitInput id="f-diameter" unit="mm" placeholder="25.75" invalid={Boolean(formState.errors.diameterMm)} {...register("diameterMm")} />
                    <FieldError message={formState.errors.diameterMm?.message} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="f-thickness">Thickness</FieldLabel>
                    <UnitInput id="f-thickness" unit="mm" placeholder="2.20" invalid={Boolean(formState.errors.thicknessMm)} {...register("thicknessMm")} />
                    <FieldError message={formState.errors.thicknessMm?.message} />
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor="f-composition">Composition</FieldLabel>
                  <ComboboxField
                    id="f-composition"
                    value={values.composition}
                    onChange={(v) => setValue("composition", v, { shouldDirty: true })}
                    suggestions={COMPOSITION_SUGGESTIONS}
                    placeholder="Silver .900, copper-nickel…"
                  />
                </div>
                <div>
                  <FieldLabel>Shape</FieldLabel>
                  <ChipSelect
                    aria-label="Coin shape"
                    value={values.shape}
                    onChange={(v) => setValue("shape", v, { shouldDirty: true })}
                    options={SHAPE_OPTIONS}
                  />
                </div>
                <div>
                  <FieldLabel>Edge</FieldLabel>
                  <ChipSelect
                    aria-label="Coin edge"
                    value={values.edge}
                    onChange={(v) => setValue("edge", v, { shouldDirty: true })}
                    options={EDGE_OPTIONS}
                  />
                </div>
              </div>,
            )}

            {sectionShell(
              "design",
              2,
              "Design & inscriptions",
              <div className="grid gap-5">
                <div>
                  <FieldLabel htmlFor="f-obvdesc">Obverse description</FieldLabel>
                  <Textarea
                    id="f-obvdesc"
                    {...register("obverseDesc")}
                    placeholder="Laureate head right; legend around…"
                    className="min-h-[110px] bg-bg-inset font-serif text-[15px] italic placeholder:italic"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="f-obvlet" hint="as struck">
                    Obverse lettering
                  </FieldLabel>
                  <Textarea
                    id="f-obvlet"
                    {...register("obverseLettering")}
                    placeholder="HADRIANVS AVGVSTVS"
                    className="min-h-[64px] bg-bg-inset font-mono text-[13px] uppercase tracking-[0.06em]"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="f-revdesc">Reverse description</FieldLabel>
                  <Textarea
                    id="f-revdesc"
                    {...register("reverseDesc")}
                    placeholder="Eagle within wreath; denomination below…"
                    className="min-h-[110px] bg-bg-inset font-serif text-[15px] italic placeholder:italic"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="f-revlet" hint="as struck">
                    Reverse lettering
                  </FieldLabel>
                  <Textarea
                    id="f-revlet"
                    {...register("reverseLettering")}
                    placeholder="SALVS AVG"
                    className="min-h-[64px] bg-bg-inset font-mono text-[13px] uppercase tracking-[0.06em]"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="f-designer">Designer</FieldLabel>
                    <Input id="f-designer" {...register("designer")} className="bg-bg-inset font-mono text-[14px]" />
                  </div>
                  <div>
                    <FieldLabel htmlFor="f-engraver">Engraver</FieldLabel>
                    <Input id="f-engraver" {...register("engraver")} className="bg-bg-inset font-mono text-[14px]" />
                  </div>
                </div>
                <div className="sm:w-1/2">
                  <FieldLabel htmlFor="f-mintage">Mintage</FieldLabel>
                  <UnitInput id="f-mintage" placeholder="57,361,000" invalid={Boolean(formState.errors.mintage)} {...register("mintage")} />
                  <FieldError message={formState.errors.mintage?.message} />
                </div>
              </div>,
            )}

            {sectionShell(
              "references",
              3,
              "Catalogue references & sources",
              <div className="grid gap-6">
                <div>
                  <FieldLabel>Catalogue references</FieldLabel>
                  <CatalogRefEditor
                    refs={values.catalogRefs}
                    onChange={(r) => setValue("catalogRefs", r, { shouldDirty: true })}
                  />
                </div>
                <div>
                  <FieldLabel>Sources</FieldLabel>
                  <SourcesEditor
                    sources={values.sources}
                    onChange={(s) => setValue("sources", s, { shouldDirty: true })}
                    errors={sourceErrors}
                  />
                </div>
              </div>,
            )}

            {sectionShell(
              "copy",
              4,
              "My copy",
              <div className="grid gap-5">
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <div role="radiogroup" aria-label="Entry status" className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((o) => {
                      const active = values.status === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setValue("status", o.value, { shouldDirty: true })}
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors",
                            active ? o.active : "border-line bg-bg-raised text-ink-dim hover:border-line-strong hover:text-ink",
                          )}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {values.status === "pending" && (
                  <div className="sm:w-1/2">
                    <FieldLabel htmlFor="f-confidence" hint="0–100">
                      Identification confidence
                    </FieldLabel>
                    <UnitInput id="f-confidence" unit="%" placeholder="87" invalid={Boolean(formState.errors.confidence)} {...register("confidence")} />
                    <FieldError message={formState.errors.confidence?.message} />
                  </div>
                )}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="f-grade">Grade</FieldLabel>
                    <ComboboxField
                      id="f-grade"
                      value={values.grade}
                      onChange={(v) => setValue("grade", v, { shouldDirty: true })}
                      suggestions={GRADE_SUGGESTIONS}
                      placeholder="VF, EF45, MS63…"
                      uppercase
                    />
                    <a
                      href="/reference#grading"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-block font-mono text-[11px] text-ink-faint underline-offset-2 hover:text-brass hover:underline"
                    >
                      Grading guide →
                    </a>
                  </div>
                  <div>
                    <FieldLabel htmlFor="f-quantity">Quantity</FieldLabel>
                    <UnitInput id="f-quantity" placeholder="1" invalid={Boolean(formState.errors.quantity)} {...register("quantity")} />
                    <FieldError message={formState.errors.quantity?.message} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="f-acqdate" hint="partial ok">
                      Acquired date
                    </FieldLabel>
                    <Input
                      id="f-acqdate"
                      {...register("acquiredDate")}
                      placeholder="2021-03-02 — or spring 2021"
                      className="bg-bg-inset font-mono text-[14px]"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="f-acqfrom">Acquired from</FieldLabel>
                    <Input
                      id="f-acqfrom"
                      {...register("acquiredFrom")}
                      placeholder="Coin fair, circulation find…"
                      className="bg-bg-inset font-mono text-[14px]"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="f-price">Price paid</FieldLabel>
                    <UnitInput id="f-price" placeholder="18.00" invalid={Boolean(formState.errors.pricePaid)} {...register("pricePaid")} />
                    <FieldError message={formState.errors.pricePaid?.message} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="f-estvalue">Estimated value</FieldLabel>
                    <UnitInput id="f-estvalue" placeholder="35.00" invalid={Boolean(formState.errors.estimatedValue)} {...register("estimatedValue")} />
                    <FieldError message={formState.errors.estimatedValue?.message} />
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor="f-storage">Storage location</FieldLabel>
                  <Input
                    id="f-storage"
                    {...register("storageLocation")}
                    placeholder="Album 2, page 14, slot C3"
                    className="bg-bg-inset font-mono text-[14px]"
                  />
                </div>
              </div>,
              true,
            )}

            {sectionShell(
              "photos",
              5,
              "Photos",
              <ImageSlots
                images={values.images}
                onChange={(img) => setValue("images", img, { shouldDirty: true })}
                fromScan={Boolean(fromIdentification)}
              />,
            )}

            {sectionShell(
              "notes",
              6,
              "Notes",
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <FieldLabel htmlFor="f-notes" hint="markdown">
                    Personal notes
                  </FieldLabel>
                  <div className="flex overflow-hidden rounded-md border border-line">
                    {(["write", "preview"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setNotesPreview(m === "preview")}
                        className={cn(
                          "px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors",
                          (m === "preview") === notesPreview
                            ? "bg-brass/10 text-brass"
                            : "text-ink-faint hover:text-ink",
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                {notesPreview ? (
                  <div className="min-h-[140px] rounded-md border border-line bg-bg-inset p-3 font-serif text-[15px] leading-[1.65] text-ink">
                    {values.notes.trim() ? (
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(values.notes) }} />
                    ) : (
                      <p className="italic text-ink-faint">Nothing to preview yet.</p>
                    )}
                  </div>
                ) : (
                  <Textarea
                    id="f-notes"
                    {...register("notes")}
                    placeholder={"Provenance, varieties, die cracks…\n\n**Markdown** supported: headings, lists, `refs`, [links](https://…)"}
                    className="min-h-[140px] bg-bg-inset font-serif text-[15px] italic"
                  />
                )}
              </div>,
            )}
          </Accordion>
        </form>

        {/* ---- Live preview rail (desktop) ---- */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <LabelPreview values={values} nextAccession={nextAccession} />
          </div>
        </aside>
      </div>

      {/* ---- Mobile preview FAB ---- */}
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        aria-label="Preview label"
        className="fixed bottom-20 right-4 z-40 flex size-12 items-center justify-center rounded-full border border-line bg-bg-raised text-ink shadow-fab-brass transition-transform active:scale-95 lg:hidden"
      >
        <Eye className="size-5" aria-hidden />
      </button>
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="bottom" className="border-line bg-bg">
          <SheetHeader>
            <SheetTitle className="font-display text-ink">Label preview</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <LabelPreview values={values} nextAccession={nextAccession} />
          </div>
        </SheetContent>
      </Sheet>

      {/* ---- Sticky footer bar ---- */}
      <div className="sticky bottom-16 z-30 mt-8 border-t border-line bg-bg/90 backdrop-blur lg:bottom-0">
        <div className="flex items-center justify-between gap-3 py-3">
          <p className="hidden font-mono text-[12px] text-ink-faint sm:block">
            {formState.isDirty ? "Unsaved changes" : "No changes yet"}
            {values.status === "draft" ? " · draft" : ""}
          </p>
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <Button type="button" variant="ghost" onClick={cancel} className="font-mono text-[12px] uppercase tracking-[0.12em]">
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={saveAsDraft}
              disabled={saving}
              className="border-line bg-bg-raised font-mono text-[12px] uppercase tracking-[0.12em] hover:border-line-strong"
            >
              Save as draft
            </Button>
            <Button
              type="button"
              onClick={saveEntry}
              disabled={saving}
              className="bg-brass font-mono text-[12px] uppercase tracking-[0.12em] text-[#131009] hover:bg-brass-bright"
            >
              {saving ? "Saving…" : mode === "add" ? "Save entry" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* ---- Duplicate dialog ---- */}
      <Dialog open={dupeOpen} onOpenChange={setDupeOpen}>
        <DialogContent className="border-line bg-bg-raised">
          <DialogHeader>
            <DialogTitle className="font-display text-ink">You already have this</DialogTitle>
            <DialogDescription className="font-serif text-[15px] text-ink-dim">
              {dupe
                ? `${dupe.title} (${formatAccession(dupe.accessionNo)}) shares country, denomination, year and mint. Save this as a second exemplar?`
                : "A matching entry already exists. Save this as a second exemplar?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            {dupe && (
              <Button
                type="button"
                variant="ghost"
                className="font-mono text-[12px] uppercase tracking-[0.1em]"
                onClick={() => navigate(`/coin/${dupe.id}`)}
              >
                View {formatAccession(dupe.accessionNo)}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="border-line font-mono text-[12px] uppercase tracking-[0.1em]"
              onClick={() => setDupeOpen(false)}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              className="bg-brass font-mono text-[12px] uppercase tracking-[0.1em] text-[#131009] hover:bg-brass-bright"
              onClick={() => {
                setDupeOpen(false);
                if (pendingPatch.current) void doSave(pendingPatch.current);
              }}
            >
              Save as exemplar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Discard-changes dialog ---- */}
      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent className="border-line bg-bg-raised">
          <DialogHeader>
            <DialogTitle className="font-display text-ink">Discard unsaved changes?</DialogTitle>
            <DialogDescription className="font-serif text-[15px] text-ink-dim">
              This entry has unsaved changes. Leaving now will lose them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-line font-mono text-[12px] uppercase tracking-[0.1em]"
              onClick={() => setDiscardOpen(false)}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="font-mono text-[12px] uppercase tracking-[0.1em]"
              onClick={() => navigate(-1)}
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Accession stamp ---- */}
      <AccessionStamp open={stamp !== null} accession={stamp ?? ""} />
    </div>
  );
}

export { coinToFormValues };
