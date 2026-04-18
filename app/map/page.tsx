import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { CampusMapPage } from "@/components/map/campus-map-page";

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
      <CampusMapPage />
    </Suspense>
  );
}
