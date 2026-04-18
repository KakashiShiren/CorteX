"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function SearchAndFilterSection({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="cortex-panel p-5 sm:p-6">
      <div className="eyebrow">Find People</div>
      <div className="mt-3 font-display text-3xl">Search verified Clark students</div>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-black/56 dark:text-white/58">
        Look up classmates by name, major, residence, or live status without digging through noisy cards.
      </p>
      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/38 dark:text-white/38" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by name, major, year, residence, or status..."
          className="pl-11"
        />
      </div>
    </div>
  );
}
