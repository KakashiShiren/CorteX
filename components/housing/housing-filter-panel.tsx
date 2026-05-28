"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type HousingFilters = {
  locationQuery: string;
  lat: number;
  lng: number;
  radius: number;
  priceMin: string;
  priceMax: string;
  bedrooms: string;
  bathrooms: string;
  amenities: string[];
  leaseType: string;
  availableFrom: string;
  matchedLabel: string;
};

export const defaultHousingFilters: HousingFilters = {
  locationQuery: "Clark University",
  lat: 42.252,
  lng: -71.8245,
  radius: 2,
  priceMin: "300",
  priceMax: "3000",
  bedrooms: "any",
  bathrooms: "any",
  amenities: [],
  leaseType: "any",
  availableFrom: "",
  matchedLabel: "Clark University"
};

const amenityOptions = [
  "WiFi",
  "Parking",
  "Furnished",
  "Laundry",
  "AC",
  "Heat included",
  "Pet-friendly",
  "Yard/Patio",
  "Gym access"
];

const bedroomOptions = ["any", "1", "2", "3", "4+"];
const bathroomOptions = ["any", "1", "1.5", "2", "2.5+"];
const leaseOptions = [
  { label: "Any length", value: "any" },
  { label: "Semester", value: "semester" },
  { label: "1 Year", value: "year" },
  { label: "Negotiable", value: "negotiable" }
];

export function getHousingFilterCount(filters: HousingFilters) {
  return [
    filters.locationQuery !== "Clark University" || filters.radius !== 2,
    filters.priceMin !== "300" || filters.priceMax !== "3000",
    filters.bedrooms !== "any",
    filters.bathrooms !== "any",
    filters.amenities.length > 0,
    filters.leaseType !== "any",
    Boolean(filters.availableFrom)
  ].filter(Boolean).length;
}

export function HousingFilterPanel({
  filters,
  total,
  isGeocoding,
  onChange,
  onClear,
  onGeocode
}: {
  filters: HousingFilters;
  total: number;
  isGeocoding: boolean;
  onChange: (filters: HousingFilters) => void;
  onClear: () => void;
  onGeocode: () => void;
}) {
  const count = getHousingFilterCount(filters);
  const update = (patch: Partial<HousingFilters>) => onChange({ ...filters, ...patch });

  return (
    <aside className="cortex-panel hover-lift space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="eyebrow">
          Filter & Search {count ? <span className="ml-2 rounded-full bg-[#9f1d2c] px-2 py-0.5 text-[10px] text-white">{count}</span> : null}
        </div>
        {count ? (
          <button type="button" onClick={onClear} className="text-[11px] font-semibold text-[#1E5A3A] dark:text-[#8FD4AC]">
            Clear all filters
          </button>
        ) : null}
      </div>

      <div className="rounded-[14px] border border-black/8 bg-white/52 px-3 py-3 text-[12px] leading-5 text-black/58 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
        Showing {total} listing{total === 1 ? "" : "s"} within {filters.radius} miles of {filters.matchedLabel || "your search"}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-cortex-ink dark:text-white">Location Search</label>
        <div className="flex gap-2">
          <Input
            value={filters.locationQuery}
            onChange={(event) => update({ locationQuery: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onGeocode();
              }
            }}
            onBlur={onGeocode}
            placeholder="e.g. Clark University, Main St"
          />
          <Button type="button" size="sm" variant="secondary" onClick={onGeocode} disabled={isGeocoding}>
            {isGeocoding ? "..." : "Go"}
          </Button>
        </div>
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-[11px] text-black/52 dark:text-white/56">
            <span>Search radius</span>
            <span>{filters.radius} miles</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={filters.radius}
            onChange={(event) => update({ radius: Number(event.target.value) })}
            className="w-full accent-[#1E5A3A]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-cortex-ink dark:text-white">Budget</label>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" value={filters.priceMin} onChange={(event) => update({ priceMin: event.target.value })} placeholder="$300" />
          <Input type="number" value={filters.priceMax} onChange={(event) => update({ priceMax: event.target.value })} placeholder="$3000" />
        </div>
        <div className="text-[11px] text-black/48 dark:text-white/52">
          ${filters.priceMin || 0} - ${filters.priceMax || 3000}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-cortex-ink dark:text-white">Bedrooms</label>
        <div className="flex flex-wrap gap-2">
          {bedroomOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => update({ bedrooms: option })}
              className={`rounded-full border px-3 py-2 text-[11px] font-semibold ${
                filters.bedrooms === option
                  ? "border-[#1C1A17] bg-[#1C1A17] text-[#F7F0E3]"
                  : "border-black/8 bg-white/60 text-black/58 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62"
              }`}
            >
              {option === "any" ? "Any" : option}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-cortex-ink dark:text-white">Bathrooms</label>
        <div className="flex flex-wrap gap-2">
          {bathroomOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => update({ bathrooms: option })}
              className={`rounded-full border px-3 py-2 text-[11px] font-semibold ${
                filters.bathrooms === option
                  ? "border-[#1C1A17] bg-[#1C1A17] text-[#F7F0E3]"
                  : "border-black/8 bg-white/60 text-black/58 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62"
              }`}
            >
              {option === "any" ? "Any" : option}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-cortex-ink dark:text-white">Amenities</label>
        <div className="space-y-2">
          {amenityOptions.map((amenity) => {
            const checked = filters.amenities.includes(amenity);
            return (
              <label key={amenity} className="flex items-center gap-2 text-[12px] text-black/62 dark:text-white/64">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    update({
                      amenities: checked
                        ? filters.amenities.filter((item) => item !== amenity)
                        : [...filters.amenities, amenity]
                    })
                  }
                  className="accent-[#1E5A3A]"
                />
                {amenity}
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-cortex-ink dark:text-white">Lease Type</label>
        <div className="space-y-2">
          {leaseOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-[12px] text-black/62 dark:text-white/64">
              <input
                type="radio"
                name="leaseType"
                checked={filters.leaseType === option.value}
                onChange={() => update({ leaseType: option.value })}
                className="accent-[#1E5A3A]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-cortex-ink dark:text-white">Available From</label>
        <Input type="date" value={filters.availableFrom} onChange={(event) => update({ availableFrom: event.target.value })} />
      </div>
    </aside>
  );
}
