"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import {
  CampusMapCategory,
  CampusMapBuilding,
  campusMapBuildings,
  campusMapCategoryColors
} from "@/lib/campus-map-data";

const LeafletCampusMap = dynamic(
  () => import("@/components/map/leaflet-campus-map").then((module) => module.LeafletCampusMap),
  {
    ssr: false,
    loading: () => <MapLoadingState />
  }
);

function MapLoadingState() {
  return (
    <div className="flex h-full min-h-[620px] items-center justify-center bg-[linear-gradient(180deg,rgba(255,250,245,0.74),rgba(247,239,227,0.92))] text-sm text-black/56 dark:bg-white/[0.04] dark:text-white/58">
      Loading campus map...
    </div>
  );
}

function slugifyBuildingName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function CampusMapPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CampusMapCategory | "all">("all");
  const [selectedBuilding, setSelectedBuilding] = useState<CampusMapBuilding | null>(
    campusMapBuildings.find((building) => building.name === "Higgins University Center") ?? campusMapBuildings[0]
  );

  useEffect(() => {
    const requestedBuilding = searchParams.get("building");
    if (!requestedBuilding) {
      return;
    }

    const normalizedTarget = requestedBuilding.toLowerCase().trim();
    const match =
      campusMapBuildings.find((building) => slugifyBuildingName(building.name) === normalizedTarget) ??
      campusMapBuildings.find((building) => String(building.id) === normalizedTarget);

    if (!match) {
      return;
    }

    setSelectedBuilding(match);
    setSearchQuery(match.name);
    setActiveCategory(match.category);
  }, [searchParams]);

  const filteredBuildings = campusMapBuildings.filter((building) => {
    const matchesSearch = building.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" ? true : building.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(campusMapBuildings.map((building) => building.category)));

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="eyebrow">Campus Map</div>
            <h1 className="mt-3 text-4xl">Find buildings, routes, and first-day essentials</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-black/56 dark:text-white/58">
              Search Clark buildings, filter by category, and jump straight to directions. The campus map now runs
              entirely on Leaflet and OpenStreetMap, so it stays interactive without depending on any external API
              key setup.
            </p>
          </div>
          <div className="rounded-full border border-black/8 bg-white/74 px-4 py-2 text-xs uppercase tracking-[0.18em] text-black/52 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/54">
            OpenStreetMap Live
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="cortex-panel overflow-hidden">
            <div className="border-b border-black/6 px-6 py-5 dark:border-white/8">
              <div className="eyebrow">Search</div>
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search Higgins, library, gym..."
                className="mt-4"
              />
            </div>

            <div className="border-b border-black/6 px-6 py-5 dark:border-white/8">
              <div className="eyebrow">Categories</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.16em] transition ${
                    activeCategory === "all"
                      ? "border-cortex-ink bg-cortex-ink text-cortex-parchment dark:border-white dark:bg-white dark:text-cortex-ink"
                      : "border-black/8 bg-white/72 text-black/62 hover:border-cortex-gold/28 dark:border-white/8 dark:bg-white/[0.04] dark:text-white/66"
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      setActiveCategory((current) => (current === category ? "all" : category))
                    }
                    className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.16em] transition ${
                      activeCategory === category
                        ? "text-white"
                        : "border-black/8 bg-white/72 text-black/62 hover:border-cortex-gold/28 dark:border-white/8 dark:bg-white/[0.04] dark:text-white/66"
                    }`}
                    style={
                      activeCategory === category
                        ? {
                            backgroundColor: campusMapCategoryColors[category],
                            borderColor: campusMapCategoryColors[category]
                          }
                        : undefined
                    }
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[380px] overflow-y-auto">
              {filteredBuildings.map((building) => {
                const isSelected = selectedBuilding?.id === building.id;

                return (
                  <button
                    key={building.id}
                    type="button"
                    onClick={() => setSelectedBuilding(building)}
                    className={`w-full border-b border-black/6 px-6 py-4 text-left transition last:border-b-0 dark:border-white/8 ${
                      isSelected
                        ? "bg-white/78 dark:bg-white/[0.07]"
                        : "hover:bg-white/58 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1 h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: campusMapCategoryColors[building.category] }}
                      />
                      <div>
                        <div className="text-sm font-medium text-cortex-ink dark:text-white">{building.name}</div>
                        <p className="mt-1 text-xs leading-5 text-black/58 dark:text-white/58">
                          {building.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {!filteredBuildings.length ? (
                <div className="px-6 py-10 text-sm text-black/52 dark:text-white/54">
                  No buildings matched that search.
                </div>
              ) : null}
            </div>

            {selectedBuilding ? (
              <div className="border-t border-black/6 px-6 py-5 dark:border-white/8">
                <div className="eyebrow">Selected Building</div>
                <div className="mt-3 font-display text-3xl">{selectedBuilding.name}</div>
                <p className="mt-3 text-sm leading-7 text-black/58 dark:text-white/62">
                  {selectedBuilding.description}
                </p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedBuilding.lat},${selectedBuilding.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex rounded-full border border-cortex-ink bg-cortex-ink px-4 py-2 text-sm text-cortex-parchment shadow-[0_14px_28px_rgba(18,17,15,0.18)] transition hover:bg-cortex-garnet dark:border-white dark:bg-white dark:text-cortex-ink"
                >
                  Get Directions
                </a>
              </div>
            ) : null}
          </div>

          <div className="cortex-panel overflow-hidden">
            <div className="border-b border-black/6 px-6 py-4 dark:border-white/8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="eyebrow">Live Map</div>
                  <div className="mt-2 font-display text-3xl">Clark campus explorer</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full border border-black/8 bg-white/72 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-black/62 dark:border-white/8 dark:bg-white/[0.05] dark:text-white/64"
                    >
                      <span
                        className="mr-2 inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: campusMapCategoryColors[category] }}
                      />
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative h-[620px] min-h-[620px] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(213,182,114,0.1),transparent_34%),linear-gradient(180deg,rgba(255,250,245,0.78),rgba(247,239,227,0.92))] dark:bg-[radial-gradient(circle_at_top_left,rgba(213,182,114,0.08),transparent_34%),linear-gradient(180deg,rgba(24,19,17,0.86),rgba(14,12,11,0.94))]">
              <LeafletCampusMap
                buildings={filteredBuildings}
                selectedBuilding={selectedBuilding}
                onSelect={setSelectedBuilding}
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
