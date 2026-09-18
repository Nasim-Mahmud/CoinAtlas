import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Upload fallback well (scan.md §Upload variant): drag-and-drop zone with a
 * file-input fallback. Multiple files are allowed — they queue across the
 * obverse/reverse steps.
 */

export interface UploadWellProps {
  onFiles: (files: File[]) => void;
  className?: string;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export default function UploadWell({ onFiles, className }: UploadWellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = [...list].filter((f) => ACCEPTED.includes(f.type));
    if (files.length === 0) {
      toast.error("That file type isn't supported", { description: "Use JPG, PNG or WEBP photos." });
      return;
    }
    onFiles(files);
  };

  return (
    <div className={cn("flex size-full flex-col items-center justify-center bg-inset px-6", className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "flex w-full max-w-[420px] cursor-pointer flex-col items-center gap-3 rounded-[16px] border-2 border-dashed px-8 py-14 text-center transition-colors",
          dragging ? "border-brass bg-brass/5" : "border-line-strong bg-inset hover:border-brass/60",
        )}
        role="button"
        tabIndex={0}
        aria-label="Upload a photo of the coin"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files);
        }}
      >
        <ImageUp className="size-8 text-brass" aria-hidden />
        <p className="font-serif text-[16px] text-ink">Drop a photo or browse</p>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">JPG · PNG · WEBP</p>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-ink-faint">
          Pick two photos at once — they'll fill obverse then reverse.
        </p>
      </motion.div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          accept(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
