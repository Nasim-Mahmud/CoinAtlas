import SectionHeader from "@/components/SectionHeader";

/** Placeholder page body used by route stubs until page agents land. */
export default function ComingSoon({ title, overline }: { title: string; overline: string }) {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-20 lg:px-6">
      <SectionHeader overline={overline} title={title} size="page" />
      <p className="mt-6 font-serif text-[16px] text-ink-dim">
        This drawer is still being fitted out — coming soon.
      </p>
    </div>
  );
}
