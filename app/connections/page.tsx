import { ConnectionsPageClient } from "@/components/connections/connections-page-client";

function toSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ConnectionsPage({
  searchParams
}: {
  searchParams?: {
    highlight?: string | string[];
  };
}) {
  return <ConnectionsPageClient highlightId={toSingleValue(searchParams?.highlight)} />;
}
