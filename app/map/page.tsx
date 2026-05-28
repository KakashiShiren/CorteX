import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { MapPageClient } from "@/components/map/map-page-client";

function MapPageFallback() {
  return (
    <AppShell>
      <div className="cortex-panel flex min-h-[620px] items-center justify-center p-8 text-sm text-black/56 dark:text-white/58">
        Loading campus map...
      </div>
    </AppShell>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<MapPageFallback />}>
      <MapPageClient />
    </Suspense>
  );
}
