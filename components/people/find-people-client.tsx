"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { FilterSidebar } from "@/components/people/filter-sidebar";
import { SearchAndFilterSection } from "@/components/people/search-and-filter-section";
import { StudentGrid } from "@/components/people/student-grid";
import { useStudentSearch } from "@/hooks/use-student-search";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function FindPeopleClient({ initialQuery = "" }: { initialQuery?: string }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    q: initialQuery,
    major: "",
    year: "",
    residence: "",
    liveStatus: "" as "" | "available" | "unavailable"
  });

  const { data, isLoading } = useStudentSearch({
    q: filters.q || undefined,
    major: filters.major || undefined,
    year: filters.year || undefined,
    residence: filters.residence || undefined,
    liveStatus: filters.liveStatus || undefined,
    page: 1,
    limit: 12
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel("find-people-statuses")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_status"
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["students"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <AppShell>
      <div className="space-y-6">
        <SearchAndFilterSection value={filters.q} onChange={(q) => setFilters({ ...filters, q })} />
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="xl:sticky xl:top-24 xl:self-start">
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              onClear={() => setFilters({ q: "", major: "", year: "", residence: "", liveStatus: "" })}
            />
          </div>
          <div className="space-y-4">
            <div className="text-sm text-black/55 dark:text-white/55">
              {isLoading ? "Searching students..." : `${data?.total ?? 0} verified students found`}
            </div>
            <StudentGrid students={data?.students ?? []} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
