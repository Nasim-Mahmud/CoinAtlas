import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import type { Theme } from "@/components/ThemeProvider";
import { SettingsCard } from "@/components/settings/SettingsShared";

/** Theme switch (settings.md §01): segmented control with mini previews. */
export default function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; label: string; sub: string; icon: typeof Moon }[] = [
    { value: "dark", label: "Cabinet", sub: "Dark", icon: Moon },
    { value: "light", label: "Album", sub: "Light", icon: Sun },
  ];

  return (
    <SettingsCard>
      <p className="overline-label">Theme</p>
      <div role="radiogroup" aria-label="Theme" className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const active = theme === o.value;
          const Icon = o.icon;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(o.value)}
              className={cn(
                "flex items-center gap-4 rounded-[10px] border p-4 text-left transition-all",
                active
                  ? "border-brass ring-1 ring-brass/40"
                  : "border-line hover:border-line-strong",
              )}
            >
              {/* Mini preview swatch */}
              <span
                aria-hidden
                className={cn(
                  "flex h-12 w-[72px] shrink-0 flex-col justify-between rounded-md border p-1.5",
                  o.value === "dark" ? "border-[#2E261A] bg-[#131009]" : "border-[#D9CCAF] bg-[#F3ECDD]",
                )}
              >
                <span className={cn("h-1 w-8 rounded-full", o.value === "dark" ? "bg-[#C9A24B]" : "bg-[#8F6D21]")} />
                <span className="flex gap-1">
                  <span className={cn("h-3 w-5 rounded-sm", o.value === "dark" ? "bg-[#1B160F]" : "bg-[#FBF7EC]", "border", o.value === "dark" ? "border-[#2E261A]" : "border-[#D9CCAF]")} />
                  <span className={cn("h-3 w-2.5 rounded-full", o.value === "dark" ? "bg-[#C9A24B]" : "bg-[#8F6D21]")} />
                </span>
              </span>
              <span>
                <span className="flex items-center gap-2 font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-ink">
                  <Icon className="size-3.5 text-brass" aria-hidden />
                  {o.label}
                </span>
                <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                  {o.sub}
                  {active ? " · active" : ""}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 font-serif text-[14px] italic leading-[1.6] text-ink-dim">
        Cabinet is the deep-walnut dark theme; Album is the parchment light theme. The choice
        follows you across the whole cabinet, instantly.
      </p>
    </SettingsCard>
  );
}
