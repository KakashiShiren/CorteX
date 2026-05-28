"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { MessageCircle, Radar, ShieldCheck, Sparkles, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { FilterSidebar } from "@/components/people/filter-sidebar";
import { SearchAndFilterSection } from "@/components/people/search-and-filter-section";
import { StudentGrid } from "@/components/people/student-grid";
import { useConnections } from "@/hooks/use-connections";
import { useRealtimeConnections } from "@/hooks/use-realtime-connections";
import { useStudentSearch } from "@/hooks/use-student-search";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

export function FindPeopleClient({
  initialQuery = "",
  initialTab = "search"
}: {
  initialQuery?: string;
  initialTab?: "search" | "connections";
}) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<"search" | "connections">(initialTab);
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
  const connectionsQuery = useConnections();
  const totalStudents = data?.total ?? 0;
  const acceptedConnectionsCount = connectionsQuery.data?.acceptedConnections.length ?? 0;
  const pendingRequestsCount = connectionsQuery.data?.pendingRequestsCount ?? 0;

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

  useRealtimeConnections(user?.id, () => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ["students"] }),
      queryClient.invalidateQueries({ queryKey: ["connections"] }),
      queryClient.invalidateQueries({ queryKey: ["connection-status"] }),
      queryClient.invalidateQueries({ queryKey: ["me"] })
    ]);
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="hero-surface motion-rise overflow-hidden">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
            <div className="ink-rule">
              <div className="page-kicker">Find People</div>
              <h1 className="page-title mt-3">Find your campus circle</h1>
              <p className="page-subtitle mt-4">
                Search verified students, see live context, and turn quick overlaps into real conversations.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[
                { label: "Verified students", value: isLoading ? "..." : totalStudents, icon: ShieldCheck },
                { label: "Connections", value: acceptedConnectionsCount, icon: Users },
                { label: "Pending", value: pendingRequestsCount, icon: MessageCircle }
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="stat-chip">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="micro-label">{item.label}</div>
                        <div className="mt-1 text-3xl font-semibold text-cortex-ink dark:text-white">{item.value}</div>
                      </div>
                      <div className="grid h-10 w-10 place-items-center rounded-full border border-black/8 bg-white/58 text-cortex-garnet dark:border-white/10 dark:bg-white/[0.06] dark:text-cortex-gold">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              variant={activeTab === "search" ? "default" : "secondary"}
              onClick={() => setActiveTab("search")}
            >
              <Radar className="mr-2 h-4 w-4" />
              Search Students
            </Button>
            <Button
              variant={activeTab === "connections" ? "default" : "secondary"}
              onClick={() => setActiveTab("connections")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              My Connections
              {acceptedConnectionsCount ? ` (${acceptedConnectionsCount})` : ""}
            </Button>
            {pendingRequestsCount > 0 ? (
              <Link href="/connections" className="text-sm font-medium text-cortex-garnet underline-offset-4 hover:underline dark:text-cortex-gold">
                {pendingRequestsCount} pending request{pendingRequestsCount === 1 ? "" : "s"}
              </Link>
            ) : null}
          </div>
        </div>

        {activeTab === "search" ? (
          <>
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
          </>
        ) : (
          <div className="space-y-4">
            <div className="cortex-panel p-5 sm:p-6">
              <div className="eyebrow">My Connections</div>
              <div className="mt-3 font-display text-3xl">Students you can message right now</div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-black/56 dark:text-white/58">
                Accepted connections stay here so you can jump back into conversations without re-running a search.
              </p>
            </div>
            {connectionsQuery.isLoading ? (
              <div className="cortex-panel p-8 text-sm text-black/60 dark:text-white/60">Loading connections...</div>
            ) : connectionsQuery.data?.acceptedConnections.length ? (
              <StudentGrid students={connectionsQuery.data.acceptedConnections} />
            ) : (
              <div className="cortex-panel p-10 text-center">
                <div className="text-2xl font-semibold">No accepted connections yet</div>
                <p className="mt-3 text-sm text-black/56 dark:text-white/58">
                  Send a few requests from the search tab, then come back here once classmates accept them.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
