"use client";

import { classYears, majors, residences } from "@/lib/constants";

type Filters = {
  q: string;
  major: string;
  year: string;
  residence: string;
  liveStatus: "" | "available" | "unavailable";
};

export function FilterSidebar({
  filters,
  onChange,
  onClear
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClear: () => void;
}) {
  return (
    <div className="cortex-panel p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="eyebrow">Filters</div>
          <div className="mt-3 text-2xl">Refine results</div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-black/56 transition hover:text-cortex-ink dark:text-white/58 dark:hover:text-white"
        >
          Clear
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <div className="text-sm font-medium">Live Status</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {([
              { value: "available", label: "Available" },
              { value: "unavailable", label: "Unavailable" }
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange({
                    ...filters,
                    liveStatus: filters.liveStatus === option.value ? "" : option.value
                  })
                }
                className={`rounded-full px-3 py-2 text-sm ${
                  filters.liveStatus === option.value
                    ? "bg-cortex-ink text-white dark:bg-white dark:text-cortex-ink"
                    : "bg-black/[0.035] text-black/64 dark:bg-white/[0.06] dark:text-white/68"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium">Major</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {majors.map((major) => (
              <button
                key={major}
                type="button"
                onClick={() => onChange({ ...filters, major: filters.major === major ? "" : major })}
                className={`rounded-full px-3 py-2 text-sm ${
                  filters.major === major
                    ? "bg-cortex-ink text-white dark:bg-white dark:text-cortex-ink"
                    : "bg-black/[0.035] text-black/64 dark:bg-white/[0.06] dark:text-white/68"
                }`}
              >
                {major}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium">Year</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {classYears.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => onChange({ ...filters, year: filters.year === year ? "" : year })}
                className={`rounded-full px-3 py-2 text-sm ${
                  filters.year === year
                    ? "bg-cortex-ink text-white dark:bg-white dark:text-cortex-ink"
                    : "bg-black/[0.035] text-black/64 dark:bg-white/[0.06] dark:text-white/68"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium">Residence</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {residences.map((residence) => (
              <button
                key={residence}
                type="button"
                onClick={() =>
                  onChange({
                    ...filters,
                    residence: filters.residence === residence ? "" : residence
                  })
                }
                className={`rounded-full px-3 py-2 text-sm ${
                  filters.residence === residence
                    ? "bg-cortex-ink text-white dark:bg-white dark:text-cortex-ink"
                    : "bg-black/[0.035] text-black/64 dark:bg-white/[0.06] dark:text-white/68"
                }`}
              >
                {residence}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
