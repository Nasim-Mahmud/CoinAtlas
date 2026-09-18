import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Camera, HardDrive, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, RevealItem } from "@/components/Reveal";
import { SettingsSection, SettingsCard } from "@/components/settings/SettingsShared";
import AppearanceSection from "@/components/settings/AppearanceSection";
import DataSection from "@/components/settings/DataSection";
import IntegrationsSection from "@/components/settings/IntegrationsSection";
import DangerZoneSection from "@/components/settings/DangerZoneSection";

/**
 * Settings (settings.md): the registrar's back office — appearance, data
 * management, optional integrations, privacy, danger zone. Left anchor nav
 * with scrollspy on desktop, horizontal pill row on mobile.
 */

const ANCHORS = [
  { id: "appearance", label: "Appearance" },
  { id: "data", label: "Backup & restore" },
  { id: "integrations", label: "Integrations" },
  { id: "privacy", label: "Privacy" },
  { id: "danger", label: "Danger zone" },
  { id: "about", label: "About" },
] as const;

const PRIVACY_POINTS = [
  {
    icon: HardDrive,
    title: "Your collection never leaves this device",
    body: "Entries, notes and catalogue references live in this browser's IndexedDB. There is no account, no server, no sync.",
  },
  {
    icon: Camera,
    title: "Photos stay on the device",
    body: "Coin photos are compressed locally in the browser and stored alongside your entries. They are never uploaded anywhere.",
  },
  {
    icon: ShieldCheck,
    title: "No analytics, no trackers",
    body: "Numisma ships no telemetry, cookies or third-party scripts. What you catalogue is your business.",
  },
  {
    icon: KeyRound,
    title: "Optional keys, your choice",
    body: "If you paste a Numista API key it is stored only in localStorage and used solely when you run a lookup. Without it, nothing is transmitted at all.",
  },
] as const;

export default function Settings() {
  const [active, setActive] = useState<string>("appearance");

  /* Scrollspy (settings.md): IntersectionObserver highlights the section in view. */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    for (const a of ANCHORS) {
      const el = document.getElementById(a.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const nav = (pill: boolean) => (
    <nav aria-label="Settings sections" className={cn(pill ? "flex gap-2 overflow-x-auto pb-1" : "space-y-1")}>
      {ANCHORS.map((a) => {
        const isActive = active === a.id;
        return (
          <a
            key={a.id}
            href={`#${a.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(a.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              setActive(a.id);
            }}
            className={cn(
              "whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
              pill
                ? cn(
                    "rounded-full border px-3 py-1.5",
                    isActive
                      ? "border-brass/60 bg-brass/10 text-brass"
                      : "border-line text-ink-dim hover:border-line-strong hover:text-ink",
                  )
                : cn(
                    "block border-l-2 py-1.5 pl-3",
                    isActive
                      ? "border-brass text-brass"
                      : "border-line text-ink-faint hover:border-line-strong hover:text-ink",
                  ),
            )}
          >
            {a.label}
          </a>
        );
      })}
    </nav>
  );

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-12 md:px-6">
      <header>
        <div className="flex items-center gap-3">
          <span aria-hidden className="h-px w-6 bg-brass" />
          <span className="overline-label">Cabinet care</span>
        </div>
        <h1 className="mt-3 font-display text-[32px] font-semibold tracking-[-0.015em] text-ink md:text-[44px]">
          Settings
        </h1>
        <p className="mt-2 max-w-[60ch] font-serif text-[15.5px] leading-[1.65] text-ink-dim">
          The registrar's office: how the cabinet looks, how your data is kept, and the few doors
          that lead outside. Everything here stays on this device.
        </p>
      </header>

      <div className="mt-8 lg:hidden">{nav(true)}</div>

      <div className="mt-8 grid gap-14 lg:mt-12 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">{nav(false)}</div>
        </aside>

        <div className="min-w-0">
          <Reveal className="space-y-16" y={20}>
            <RevealItem>
              <SettingsSection id="appearance" index={1} title="Appearance">
                <AppearanceSection />
              </SettingsSection>
            </RevealItem>

            <RevealItem>
              <SettingsSection id="data" index={2} title="Backup & restore">
                <DataSection />
              </SettingsSection>
            </RevealItem>

            <RevealItem>
              <SettingsSection id="integrations" index={3} title="Integrations">
                <IntegrationsSection />
              </SettingsSection>
            </RevealItem>

            <RevealItem>
              <SettingsSection id="privacy" index={4} title="Privacy">
                <SettingsCard>
                  <div className="flex items-center gap-3">
                    <Lock className="size-5 text-patina" aria-hidden />
                    <h3 className="font-display text-[18px] font-medium text-ink">
                      What leaves this device
                    </h3>
                  </div>
                  <p className="mt-2 max-w-[62ch] font-serif text-[14.5px] leading-[1.6] text-ink-dim">
                    The honest answer: <span className="text-ink">nothing</span> — unless you paste
                    an API key and run a lookup yourself.
                  </p>
                  <ul className="mt-5 space-y-4">
                    {PRIVACY_POINTS.map((p) => (
                      <li key={p.title} className="flex gap-3">
                        <p.icon className="mt-0.5 size-4 shrink-0 text-patina" aria-hidden />
                        <div>
                          <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink">
                            {p.title}
                          </p>
                          <p className="mt-1 font-serif text-[14px] leading-[1.6] text-ink-dim">
                            {p.body}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </SettingsCard>
              </SettingsSection>
            </RevealItem>

            <RevealItem>
              <SettingsSection id="danger" index={5} title="Danger zone" danger>
                <DangerZoneSection />
              </SettingsSection>
            </RevealItem>

            <RevealItem>
              <SettingsSection id="about" index={6} title="About">
                <SettingsCard className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="size-5 text-brass" aria-hidden />
                    <p className="max-w-[52ch] font-serif text-[14.5px] leading-[1.6] text-ink-dim">
                      The story of the cabinet, how identification works, and the credits — on the{" "}
                      <span className="text-ink">About</span> page.
                    </p>
                  </div>
                  <Link
                    to="/about"
                    className="rounded-md border border-line bg-bg-raised px-4 py-2.5 font-mono text-[12px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-line-strong"
                  >
                    Visit About
                  </Link>
                </SettingsCard>
              </SettingsSection>
            </RevealItem>
          </Reveal>

          <p className="mt-16 border-t border-line pt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
            Numisma v1.0.0 · All data on-device
          </p>
        </div>
      </div>
    </div>
  );
}
