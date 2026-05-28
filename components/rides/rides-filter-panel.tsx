"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type RideFilters = {
  destination: string;
  dateFrom: string;
  dateTo: string;
  timeFilter: string;
  priceMin: string;
  priceMax: string;
  seats: string;
};

const emptyFilters: RideFilters = {
  destination: "",
  dateFrom: "",
  dateTo: "",
  timeFilter: "",
  priceMin: "",
  priceMax: "",
  seats: ""
};

const timeOptions = [
  { label: "Morning", value: "morning" },
  { label: "Afternoon", value: "afternoon" },
  { label: "Evening", value: "evening" },
  { label: "Night", value: "night" }
];

const commonDestinations = ["Boston", "Cambridge", "NYC", "Providence", "Worcester", "Logan Airport"];

export function getRideFilterCount(filters: RideFilters, view: "driver" | "passenger") {
  const entries = [
    filters.destination,
    filters.dateFrom || filters.dateTo,
    view === "driver" ? filters.timeFilter : "",
    view === "driver" ? filters.priceMin || filters.priceMax : "",
    filters.seats
  ];

  return entries.filter(Boolean).length;
}

export function RidesFilterPanel({
  view,
  filters,
  onChange,
  onClear
}: {
  view: "driver" | "passenger";
  filters: RideFilters;
  onChange: (filters: RideFilters) => void;
  onClear: () => void;
}) {
  const count = getRideFilterCount(filters, view);
  const update = (patch: Partial<RideFilters>) => onChange({ ...filters, ...patch });

  return (
    <aside className="cortex-panel hover-lift space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="eyebrow">Filter By</div>
        {count ? (
          <button type="button" onClick={onClear} className="text-[11px] font-semibold text-[#8B6914]">
            Clear all filters
          </button>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-cortex-ink dark:text-white">Destination</label>
          {filters.destination ? (
            <button type="button" className="text-[10px] text-black/44 dark:text-white/48" onClick={() => update({ destination: "" })}>
              Clear
            </button>
          ) : null}
        </div>
        <Input
          value={filters.destination}
          onChange={(event) => update({ destination: event.target.value })}
          placeholder={view === "driver" ? "Where are you going?" : "Which students are going where?"}
          list="ride-destinations"
        />
        <datalist id="ride-destinations">
          {commonDestinations.map((destination) => (
            <option key={destination} value={destination} />
          ))}
        </datalist>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-cortex-ink dark:text-white">Date range</label>
          {filters.dateFrom || filters.dateTo ? (
            <button type="button" className="text-[10px] text-black/44 dark:text-white/48" onClick={() => update({ dateFrom: "", dateTo: "" })}>
              Clear
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={filters.dateFrom} onChange={(event) => update({ dateFrom: event.target.value })} />
          <Input type="date" value={filters.dateTo} onChange={(event) => update({ dateTo: event.target.value })} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const today = new Date();
              const saturday = new Date(today);
              saturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7));
              const sunday = new Date(saturday);
              sunday.setDate(saturday.getDate() + 1);
              update({
                dateFrom: saturday.toISOString().slice(0, 10),
                dateTo: sunday.toISOString().slice(0, 10)
              });
            }}
          >
            This weekend
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const start = new Date();
              start.setDate(start.getDate() + 7);
              const end = new Date(start);
              end.setDate(start.getDate() + 6);
              update({
                dateFrom: start.toISOString().slice(0, 10),
                dateTo: end.toISOString().slice(0, 10)
              });
            }}
          >
            Next week
          </Button>
        </div>
      </div>

      {view === "driver" ? (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-cortex-ink dark:text-white">Departure time</label>
              {filters.timeFilter ? (
                <button type="button" className="text-[10px] text-black/44 dark:text-white/48" onClick={() => update({ timeFilter: "" })}>
                  Clear
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => update({ timeFilter: filters.timeFilter === option.value ? "" : option.value })}
                  className={`rounded-full border px-3 py-2 text-[11px] font-semibold transition ${
                    filters.timeFilter === option.value
                      ? "border-[#1C1A17] bg-[#1C1A17] text-[#F7F0E3]"
                      : "border-black/8 bg-white/60 text-black/58 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-cortex-ink dark:text-white">Price range</label>
              {filters.priceMin || filters.priceMax ? (
                <button type="button" className="text-[10px] text-black/44 dark:text-white/48" onClick={() => update({ priceMin: "", priceMax: "" })}>
                  Clear
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" min={0} max={50} value={filters.priceMin} onChange={(event) => update({ priceMin: event.target.value })} placeholder="$5" />
              <Input type="number" min={0} max={50} value={filters.priceMax} onChange={(event) => update({ priceMax: event.target.value })} placeholder="$50" />
            </div>
          </div>
        </>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-cortex-ink dark:text-white">
            {view === "driver" ? "Seats needed" : "Seats"}
          </label>
          {filters.seats ? (
            <button type="button" className="text-[10px] text-black/44 dark:text-white/48" onClick={() => update({ seats: "" })}>
              Clear
            </button>
          ) : null}
        </div>
        <select
          value={filters.seats}
          onChange={(event) => update({ seats: event.target.value })}
          className="h-12 w-full rounded-2xl border border-black/8 bg-[#fffaf3]/88 px-4 text-sm text-cortex-ink outline-none dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
        >
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((seat) => (
            <option key={seat} value={seat}>
              {seat === 5 ? "5+" : seat}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}

export { emptyFilters };
