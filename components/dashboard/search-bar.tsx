"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { suggestedQuestions } from "@/lib/constants";
import { useDashboardStore } from "@/stores/dashboard-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function routeForQuery(query: string) {
  const normalized = query.toLowerCase();
  if (
    ["where", "map", "directions", "hall", "library", "center", "gym", "building", "cafeteria"].some((term) =>
      normalized.includes(term)
    )
  ) {
    return `/ai-chat?q=${encodeURIComponent(query)}`;
  }

  if (["?", "hours", "open", "number", "reserve", "can i"].some((term) => normalized.includes(term))) {
    return `/ai-chat?q=${encodeURIComponent(query)}`;
  }

  return `/find-people?q=${encodeURIComponent(query)}`;
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const recentSearches = useDashboardStore((state) => state.recentSearches);
  const addSearch = useDashboardStore((state) => state.addSearch);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }

    addSearch(query);
    router.push(routeForQuery(query));
  };

  return (
    <div className="cortex-panel p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search students, buildings, or ask a campus question..."
            className="pl-11"
          />
        </div>
        <Button type="submit">Search Cortex</Button>
      </form>

      <div className="mt-6 space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-black/42 dark:text-white/42">
          Suggested
        </div>
        <div className="flex flex-wrap gap-2.5">
          {suggestedQuestions.slice(0, 4).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setQuery(item)}
              className="rounded-full border border-black/8 px-3.5 py-2 text-sm text-black/66 transition hover:border-black/16 hover:bg-black/[0.03] hover:text-cortex-ink dark:border-white/10 dark:text-white/68 dark:hover:bg-white/[0.05]"
            >
              {item}
            </button>
          ))}
        </div>
        {recentSearches.length ? (
          <>
            <div className="pt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-black/42 dark:text-white/42">
              Recent Searches
            </div>
            <div className="flex flex-wrap gap-2.5">
              {recentSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setQuery(item);
                    router.push(routeForQuery(item));
                  }}
                  className="rounded-full bg-black/[0.035] px-3.5 py-2 text-sm text-black/62 dark:bg-white/[0.06] dark:text-white/68"
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
