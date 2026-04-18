"use client";

import { Search } from "lucide-react";

import { Building } from "@/lib/types";
import { Input } from "@/components/ui/input";

export function BuildingList({
  search,
  onSearch,
  buildings,
  selectedBuildingId,
  onSelect
}: {
  search: string;
  onSearch: (value: string) => void;
  buildings: Building[];
  selectedBuildingId?: string;
  onSelect: (building: Building) => void;
}) {
  return (
    <div className="cortex-panel p-6">
      <div className="eyebrow">Buildings</div>
      <div className="mt-3 text-2xl">Find a destination</div>
      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
        <Input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search Higgins, library, gym..."
          className="pl-11"
        />
      </div>
      <div className="mt-5 max-h-[320px] space-y-3 overflow-y-auto pr-1">
        {buildings.map((building) => (
          <button
            key={building.id}
            type="button"
            onClick={() => onSelect(building)}
            className={`w-full rounded-[22px] border p-4 text-left transition ${
              selectedBuildingId === building.id
                ? "border-cortex-ember bg-cortex-ember/10"
                : "border-black/10 hover:border-cortex-ember/25 dark:border-white/10"
            }`}
          >
            <div className="text-lg font-semibold">{building.name}</div>
            <div className="mt-1 text-sm text-black/55 dark:text-white/55">{building.category}</div>
            <p className="mt-3 text-sm leading-6 text-black/65 dark:text-white/65">{building.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
