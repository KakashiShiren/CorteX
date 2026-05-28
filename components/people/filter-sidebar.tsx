"use client";

import { classYears, getResidencesForDomain, majors } from "@/lib/constants";
import { useAuthSession } from "@/hooks/use-auth-session";

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
  const { data: session } = useAuthSession();
  const residences = getResidencesForDomain(session?.universityDomain);

  return (
    <div className="cortex-panel hover-lift p-6">
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
                className={`filter-pill ${
                  filters.liveStatus === option.value
                    ? "filter-pill-active"
                    : "filter-pill-idle"
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
                className={`filter-pill ${
                  filters.major === major
                    ? "filter-pill-active"
                    : "filter-pill-idle"
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
                className={`filter-pill ${
                  filters.year === year
                    ? "filter-pill-active"
                    : "filter-pill-idle"
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
                className={`filter-pill ${
                  filters.residence === residence
                    ? "filter-pill-active"
                    : "filter-pill-idle"
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
