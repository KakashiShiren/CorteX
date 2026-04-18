"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { BuildingDetailsPanel } from "@/components/map/building-details-panel";
import { BuildingList } from "@/components/map/building-list";
import { DirectionsPanel } from "@/components/map/directions-panel";
import { FavoritesPanel } from "@/components/map/favorites-panel";
import { useBuildings } from "@/hooks/use-buildings";
import { apiFetch } from "@/lib/api";
import { useMapStore } from "@/stores/map-store";

const CampusMapClient = dynamic(
  () => import("@/components/map/campus-map-client").then((module) => module.CampusMapClient),
  { ssr: false }
);

export function MapPageClient({ initialQuery = "" }: { initialQuery?: string }) {
  const [search, setSearch] = useState(initialQuery);
  const [routeMeta, setRouteMeta] = useState({ distance: "", duration: "" });
  const { data } = useBuildings();
  const {
    selectedBuilding,
    selectBuilding,
    favorites,
    toggleFavorite,
    userLocation,
    setUserLocation,
    directions,
    setDirections
  } = useMapStore();

  const allBuildings = data?.buildings ?? [];
  const filteredBuildings = allBuildings.filter((building) => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [building.name, building.category, building.description].some((value) =>
      value.toLowerCase().includes(query)
    );
  });

  const favoriteBuildings = allBuildings.filter((building) => favorites.includes(building.id));

  useEffect(() => {
    if (!selectedBuilding && filteredBuildings.length && search.trim()) {
      selectBuilding(filteredBuildings[0]);
    }
  }, [filteredBuildings, search, selectBuilding, selectedBuilding]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="eyebrow">Motor Cortex</div>
          <h1 className="mt-3 text-4xl">Navigate Clark in seconds</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-black/60 dark:text-white/60">
            Search a building, view campus details, and calculate a quick walking route from wherever you are.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <BuildingList
              search={search}
              onSearch={setSearch}
              buildings={filteredBuildings}
              selectedBuildingId={selectedBuilding?.id}
              onSelect={selectBuilding}
            />
            <FavoritesPanel favorites={favoriteBuildings} onSelect={selectBuilding} />
          </div>

          <CampusMapClient
            buildings={filteredBuildings}
            selectedBuilding={selectedBuilding}
            userLocation={userLocation}
            onSelect={selectBuilding}
          />

          <div className="space-y-6">
            <BuildingDetailsPanel
              building={selectedBuilding}
              isFavorite={selectedBuilding ? favorites.includes(selectedBuilding.id) : false}
              onToggleFavorite={() => selectedBuilding && toggleFavorite(selectedBuilding.id)}
              onGetDirections={async () => {
                if (!selectedBuilding) {
                  return;
                }

                const origin =
                  userLocation ??
                  ({
                    lat: 42.2512,
                    lng: -71.8242
                  } as const);

                const response = await apiFetch<{ steps: Array<any>; distance: string; duration: string }>(
                  "/api/campus/directions",
                  {
                    method: "POST",
                    body: JSON.stringify({
                      fromLat: origin.lat,
                      fromLng: origin.lng,
                      toLat: selectedBuilding.latitude,
                      toLng: selectedBuilding.longitude
                    })
                  }
                );

                setDirections(response.steps);
                setRouteMeta({ distance: response.distance, duration: response.duration });
              }}
            />
            <DirectionsPanel directions={directions} distance={routeMeta.distance} duration={routeMeta.duration} />
            <button
              type="button"
              onClick={() => {
                navigator.geolocation.getCurrentPosition((position) => {
                  setUserLocation(position.coords.latitude, position.coords.longitude);
                });
              }}
              className="cortex-panel w-full p-4 text-left text-sm"
            >
              Use my current location
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
