"use client";

import { Search } from "lucide-react";

import { marketplaceCategories, marketplaceConditions } from "@/lib/marketplace";
import { Input } from "@/components/ui/input";

export type MarketplaceFilters = {
  category: string;
  priceMin: string;
  priceMax: string;
  conditions: string[];
  shipping: "all" | "pickup" | "shipping";
  ratingMin: number;
  search: string;
};

export const defaultMarketplaceFilters: MarketplaceFilters = {
  category: "",
  priceMin: "0",
  priceMax: "2000",
  conditions: [],
  shipping: "all",
  ratingMin: 1,
  search: ""
};

export function getMarketplaceFilterCount(filters: MarketplaceFilters) {
  let count = 0;

  if (filters.category) count += 1;
  if (filters.priceMin && filters.priceMin !== "0") count += 1;
  if (filters.priceMax && filters.priceMax !== "2000") count += 1;
  if (filters.conditions.length) count += filters.conditions.length;
  if (filters.shipping !== "all") count += 1;
  if (filters.ratingMin > 1) count += 1;
  if (filters.search.trim()) count += 1;

  return count;
}

export function MarketplaceFilterPanel({
  filters,
  total,
  onChange,
  onClear
}: {
  filters: MarketplaceFilters;
  total: number;
  onChange: (filters: MarketplaceFilters) => void;
  onClear: () => void;
}) {
  const setFilter = <K extends keyof MarketplaceFilters>(key: K, value: MarketplaceFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="cortex-panel sticky top-28 space-y-7 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="eyebrow">Filters</div>
          <div className="mt-2 text-sm text-black/52 dark:text-white/56">{total} campus item{total === 1 ? "" : "s"}</div>
        </div>
        <button type="button" onClick={onClear} className="text-xs font-semibold text-cortex-garnet underline-offset-4 hover:underline dark:text-cortex-gold">
          Clear all
        </button>
      </div>

      <section className="space-y-3">
        <div className="micro-label">Search</div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/36 dark:text-white/38" />
          <Input
            value={filters.search}
            onChange={(event) => setFilter("search", event.target.value)}
            placeholder="Search items..."
            className="pl-10"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="micro-label">Categories</div>
        <div className="space-y-2">
          {marketplaceCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilter("category", filters.category === category ? "" : category)}
              className={`block w-full text-left text-sm transition ${
                filters.category === category
                  ? "font-semibold text-cortex-ink underline decoration-cortex-gold underline-offset-4 dark:text-white"
                  : "text-black/58 hover:text-cortex-ink dark:text-white/58 dark:hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="micro-label">Price Range</div>
        <div className="rounded-[20px] border border-black/8 bg-white/36 p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-sm font-semibold text-cortex-ink dark:text-white">
            ${filters.priceMin || "0"} - ${filters.priceMax || "2000"}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Input
              type="number"
              min={0}
              value={filters.priceMin}
              onChange={(event) => setFilter("priceMin", event.target.value)}
              placeholder="Min"
            />
            <Input
              type="number"
              min={0}
              value={filters.priceMax}
              onChange={(event) => setFilter("priceMax", event.target.value)}
              placeholder="Max"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="micro-label">Condition</div>
        <div className="space-y-2">
          {marketplaceConditions.map((condition) => {
            const checked = filters.conditions.includes(condition);
            return (
              <label key={condition} className="flex items-center gap-2 text-sm text-black/62 dark:text-white/64">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setFilter(
                      "conditions",
                      checked
                        ? filters.conditions.filter((item) => item !== condition)
                        : [...filters.conditions, condition]
                    )
                  }
                  className="accent-[#3f5f55]"
                />
                {condition}
              </label>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="micro-label">Shipping</div>
        <div className="space-y-2">
          {[
            { value: "all", label: "All items" },
            { value: "pickup", label: "Local pickup only" },
            { value: "shipping", label: "Shipping available" }
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-black/62 dark:text-white/64">
              <input
                type="radio"
                name="marketplaceShipping"
                checked={filters.shipping === option.value}
                onChange={() => setFilter("shipping", option.value as MarketplaceFilters["shipping"])}
                className="accent-[#3f5f55]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="micro-label">Seller Rating</div>
        <input
          type="range"
          min={1}
          max={5}
          step={0.5}
          value={filters.ratingMin}
          onChange={(event) => setFilter("ratingMin", Number(event.target.value))}
          className="w-full accent-[#3f5f55]"
        />
        <div className="text-xs text-black/52 dark:text-white/56">{filters.ratingMin}+ stars</div>
      </section>
    </div>
  );
}
