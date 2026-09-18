import EmptyState from "@/components/EmptyState";

/** 404 — archival empty state (design.md §9). */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-24 lg:px-6">
      <EmptyState
        headline="This drawer is empty"
        body="The page you're looking for isn't filed in this cabinet. It may have been re-accessioned, or perhaps it never existed."
        cta={{ label: "Return to the cabinet", to: "/" }}
        secondaryCta={{ label: "Browse the collection", to: "/collection" }}
      />
    </div>
  );
}
