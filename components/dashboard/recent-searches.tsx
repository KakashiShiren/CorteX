"use client";

import { useRouter } from "next/navigation";

import { useDashboardStore } from "@/stores/dashboard-store";
import { Button } from "@/components/ui/button";

export function RecentSearches() {
  const router = useRouter();
  const searches = useDashboardStore((state) => state.recentSearches);
  const clearHistory = useDashboardStore((state) => state.clearHistory);

  return (
    <div className="cortex-panel p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="eyebrow">Recent Searches</div>
          <div className="mt-3 text-2xl">Jump back in</div>
        </div>
        <Button variant="ghost" size="sm" onClick={clearHistory}>
          Clear
        </Button>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {searches.length ? (
          searches.map((search) => (
            <button
              key={search}
              type="button"
              onClick={() => router.push(`/find-people?q=${encodeURIComponent(search)}`)}
              className="rounded-full bg-black/[0.035] px-3.5 py-2 text-sm text-black/62 transition hover:bg-black/[0.055] dark:bg-white/[0.06] dark:text-white/68 dark:hover:bg-white/[0.09]"
            >
              {search}
            </button>
          ))
        ) : (
          <p className="text-sm text-black/56 dark:text-white/58">Your last five searches will appear here.</p>
        )}
      </div>
    </div>
  );
}
