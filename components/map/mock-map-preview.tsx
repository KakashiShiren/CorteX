import { Compass, MapPinned, Route, Sparkles } from "lucide-react";

import { demoBuildings } from "@/lib/demo-data";

function toMarkerPosition(latitude: number, longitude: number) {
  const latitudes = demoBuildings.map((building) => building.latitude);
  const longitudes = demoBuildings.map((building) => building.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const x = ((longitude - minLng) / (maxLng - minLng || 1)) * 62 + 16;
  const y = (1 - (latitude - minLat) / (maxLat - minLat || 1)) * 56 + 14;

  return { x, y };
}

export function MockMapPreview() {
  const featuredBuilding = demoBuildings.find((building) => building.name === "Higgins University Center") ?? demoBuildings[0];

  return (
    <div className="overflow-hidden rounded-[28px] border border-black/6 bg-white/38 dark:border-white/8 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/6 px-5 py-4 dark:border-white/8">
        <div>
          <div className="eyebrow">Feature Preview</div>
          <div className="mt-2 font-display text-3xl">Campus map mockup</div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {["Open Now", "Dining", "Study", "Athletics"].map((item) => (
            <span
              key={item}
              className="rounded-full border border-black/8 bg-white/72 px-3 py-1.5 text-black/66 dark:border-white/8 dark:bg-white/[0.05] dark:text-white/68"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-[420px] overflow-hidden cortex-map-paper">
          <div className="absolute inset-0 subtle-grid opacity-20 dark:opacity-10" />
          <div className="absolute inset-x-10 top-10 h-16 rounded-full border border-black/6 bg-white/52 px-5 py-4 shadow-[0_18px_36px_rgba(18,17,15,0.08)] dark:border-white/8 dark:bg-white/[0.05]">
            <div className="flex items-center gap-3 text-sm text-black/66 dark:text-white/68">
              <Compass className="h-4 w-4 text-cortex-garnet dark:text-cortex-gold" />
              Search Higgins, library, gym...
            </div>
          </div>

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M10 78 C22 62, 36 60, 54 52 S82 34, 92 18" fill="none" stroke="rgba(18,17,15,0.18)" strokeWidth="1.8" />
            <path d="M8 36 C24 44, 34 44, 50 40 S74 24, 92 28" fill="none" stroke="rgba(18,17,15,0.11)" strokeWidth="1.4" />
            <path d="M24 10 C34 18, 40 30, 44 42 S52 72, 70 88" fill="none" stroke="rgba(18,17,15,0.09)" strokeWidth="1.2" />
          </svg>

          {demoBuildings.map((building, index) => {
            const position = toMarkerPosition(building.latitude, building.longitude);
            const isFeatured = building.id === featuredBuilding.id;

            return (
              <div
                key={building.id}
                className="absolute"
                style={{ left: `${position.x}%`, top: `${position.y}%`, transform: "translate(-50%, -50%)" }}
              >
                <div
                  className={`relative flex h-5 w-5 items-center justify-center rounded-full border ${
                    isFeatured
                      ? "border-cortex-gold bg-cortex-ember text-cortex-parchment shadow-[0_14px_30px_rgba(159,29,44,0.28)]"
                      : "border-cortex-gold/70 bg-cortex-ink text-cortex-parchment"
                  }`}
                >
                  <MapPinned className="h-3 w-3" />
                </div>
                <div
                  className={`mt-2 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium shadow-[0_12px_24px_rgba(18,17,15,0.08)] ${
                    isFeatured
                      ? "border-cortex-gold/30 bg-white/94 text-cortex-ink"
                      : "border-black/8 bg-white/82 text-black/68 dark:border-white/8 dark:bg-black/48 dark:text-white/72"
                  }`}
                  style={{ transform: `translateX(${index % 2 === 0 ? "-15%" : "-55%"})` }}
                >
                  {building.name}
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-5 left-5 rounded-[22px] border border-cortex-gold/20 bg-cortex-ink/96 px-4 py-3 text-cortex-parchment shadow-[0_20px_42px_rgba(18,17,15,0.22)]">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-cortex-gold/70">
              <Sparkles className="h-3.5 w-3.5" />
              Mock live map
            </div>
            <p className="mt-2 max-w-[220px] text-sm leading-6 text-cortex-parchment/74">
              Previewing building pins, quick search, and route overlays while the live wayfinding layer is finished.
            </p>
          </div>
        </div>

        <div className="border-t border-black/6 p-5 dark:border-white/8 xl:border-l xl:border-t-0">
          <div className="eyebrow">Selected Building</div>
          <div className="mt-3 font-display text-3xl">{featuredBuilding.name}</div>
          <p className="mt-3 text-sm leading-7 text-black/58 dark:text-white/62">
            {featuredBuilding.description}
          </p>

          <div className="mt-6 space-y-3 rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.04]">
            <div className="text-[11px] uppercase tracking-[0.22em] text-black/42 dark:text-white/42">Preview Details</div>
            <div className="text-sm text-black/66 dark:text-white/68">{featuredBuilding.address}</div>
            <div className="text-sm text-black/66 dark:text-white/68">
              Weekday hours preview: {featuredBuilding.hours.monday?.open} - {featuredBuilding.hours.monday?.close}
            </div>
            <div className="flex flex-wrap gap-2">
              {featuredBuilding.facilities.slice(0, 4).map((facility) => (
                <span
                  key={facility}
                  className="rounded-full border border-black/8 bg-white/72 px-3 py-1 text-[11px] text-black/62 dark:border-white/8 dark:bg-white/[0.05] dark:text-white/68"
                >
                  {facility.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-cortex-ink px-4 py-2 text-sm text-cortex-parchment shadow-[0_14px_28px_rgba(18,17,15,0.18)] dark:bg-white dark:text-cortex-ink"
            >
              <Route className="h-4 w-4" />
              Route Preview
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/78 px-4 py-2 text-sm text-black/66 dark:border-white/8 dark:bg-white/[0.05] dark:text-white/68"
            >
              <Compass className="h-4 w-4" />
              Explore Nearby
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
