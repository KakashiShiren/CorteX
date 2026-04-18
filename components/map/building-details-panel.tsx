"use client";

import { Heart, Route } from "lucide-react";

import { Building } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function BuildingDetailsPanel({
  building,
  isFavorite,
  onToggleFavorite,
  onGetDirections
}: {
  building: Building | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onGetDirections: () => void;
}) {
  if (!building) {
    return (
      <div className="cortex-panel p-6">
        <div className="text-2xl font-semibold">Select a building</div>
        <p className="mt-3 text-sm text-black/60 dark:text-white/60">
          Pick a marker or search result to see details, hours, facilities, and directions.
        </p>
      </div>
    );
  }

  return (
    <div className="cortex-panel p-6">
      <div className="eyebrow">Building Details</div>
      <div className="mt-3 text-3xl">{building.name}</div>
      <p className="mt-4 text-sm leading-7 text-black/65 dark:text-white/65">{building.description}</p>
      <div className="mt-5 space-y-2 text-sm text-black/60 dark:text-white/60">
        <div>{building.address}</div>
        {building.phone ? <div>{building.phone}</div> : null}
        {building.email ? <div>{building.email}</div> : null}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {building.facilities.map((facility) => (
          <span key={facility} className="rounded-full bg-black/[0.04] px-3 py-1 text-xs dark:bg-white/[0.06]">
            {facility}
          </span>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={onGetDirections}>
          <Route className="mr-2 h-4 w-4" />
          Get Directions
        </Button>
        <Button variant="secondary" onClick={onToggleFavorite}>
          <Heart className="mr-2 h-4 w-4" />
          {isFavorite ? "Remove Favorite" : "Save Favorite"}
        </Button>
      </div>
    </div>
  );
}
