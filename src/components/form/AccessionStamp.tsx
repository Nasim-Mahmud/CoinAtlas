import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Accession stamp — design.md §5 signature #4. On save, a
 * "CATALOGUED · Nº XXXX" stamp animates in: rotated -4°, stamp outline,
 * scale 1.4→1 with slight overshoot, 0.45s.
 */
export default function AccessionStamp({
  open,
  accession,
}: {
  open: boolean;
  accession: string;
}) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="flex flex-col items-center gap-6 border-line bg-bg-raised py-12 sm:max-w-[380px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Entry catalogued</DialogTitle>
        <div className="flex size-12 items-center justify-center rounded-full border border-patina/50 bg-patina/10">
          <Check className="size-6 text-patina" aria-hidden />
        </div>
        {open && (
          <motion.div
            initial={{ scale: 1.4, opacity: 0, rotate: -4 }}
            animate={{ scale: [1.4, 0.96, 1], opacity: [0, 0.9, 1], rotate: -4 }}
            transition={{ duration: 0.45, times: [0, 0.7, 1], ease: "easeOut" }}
            className="rounded-md border-[3px] border-oxblood/80 px-6 py-3 shadow-[inset_0_0_0_1px_rgb(var(--oxblood)/0.5)]"
          >
            <p className="font-mono text-[18px] font-semibold uppercase tracking-[0.2em] text-oxblood">
              Catalogued
            </p>
            <p className="mt-0.5 text-center font-mono text-[13px] uppercase tracking-[0.2em] text-oxblood/80">
              {accession}
            </p>
          </motion.div>
        )}
        <p className="font-serif text-[14px] italic text-ink-dim">
          Entered into the cabinet — opening the wall label…
        </p>
      </DialogContent>
    </Dialog>
  );
}
