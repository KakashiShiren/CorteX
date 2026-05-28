"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, Plus, SlidersHorizontal, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RideCard } from "@/components/rides/ride-card";
import { CreateRidePostModal, RideContactModal } from "@/components/rides/ride-modals";
import { emptyFilters, getRideFilterCount, RideFilters, RidesFilterPanel } from "@/components/rides/rides-filter-panel";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { RidePost } from "@/lib/rides";
import { useAuthSession } from "@/hooks/use-auth-session";

type RidesResponse = {
  rides: RidePost[];
  hasMore: boolean;
  total: number;
};

function buildRideSearchParams(view: "driver" | "passenger", filters: RideFilters) {
  const params = new URLSearchParams({
    type: view,
    limit: "40",
    page: "1"
  });

  if (filters.destination.trim()) {
    params.set("destination", filters.destination.trim());
  }

  if (filters.dateFrom) {
    params.set("date_from", filters.dateFrom);
  }

  if (filters.dateTo) {
    params.set("date_to", filters.dateTo);
  }

  if (view === "driver" && filters.timeFilter) {
    params.set("time_filter", filters.timeFilter);
  }

  if (view === "driver" && filters.priceMin) {
    params.set("price_min", filters.priceMin);
  }

  if (view === "driver" && filters.priceMax) {
    params.set("price_max", filters.priceMax);
  }

  if (filters.seats) {
    params.set("seats", filters.seats);
  }

  return params;
}

function announceRideFilterCount(count: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("grove-nav-filter-count:rides", String(count));
  window.dispatchEvent(
    new CustomEvent("grove-nav-filter-count", {
      detail: {
        href: "/rides",
        count
      }
    })
  );
}

export function RidesPageClient() {
  const queryClient = useQueryClient();
  const meQuery = useAuthSession();
  const [view, setView] = useState<"driver" | "passenger">("driver");
  const [filters, setFilters] = useState<RideFilters>(emptyFilters);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState<RidePost | null>(null);
  const [contactMode, setContactMode] = useState<"request" | "offer">("request");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentUser = meQuery.data;
  const activeFilterCount = useMemo(() => getRideFilterCount(filters, view), [filters, view]);
  const searchParams = useMemo(() => buildRideSearchParams(view, filters), [filters, view]);
  const ridesQuery = useQuery({
    queryKey: ["rides", view, searchParams.toString()],
    queryFn: () => apiFetch<RidesResponse>(`/api/rides?${searchParams.toString()}`),
    enabled: Boolean(currentUser?.id),
    staleTime: 20_000
  });

  const rides = ridesQuery.data?.rides ?? [];
  const heading = view === "driver" ? "Find a ride" : "Share a ride request";
  const subheading =
    view === "driver"
      ? "Browse rides posted by drivers in your university community"
      : "Tell drivers where you need to go";

  useEffect(() => {
    announceRideFilterCount(activeFilterCount);
  }, [activeFilterCount]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setToastMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    if (!currentUser?.universityId) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`rides-feed:${currentUser.universityId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ride_posts",
          filter: `university_id=eq.${currentUser.universityId}`
        },
        () => {
          setToastMessage("New ride post added.");
          void queryClient.invalidateQueries({ queryKey: ["rides"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUser?.universityId, queryClient]);

  return (
    <AppShell>
      {toastMessage ? <div className="toast-surface">{toastMessage}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="page-kicker">Rides</div>
              <h1 className="page-title mt-3">{heading}</h1>
              <p className="page-subtitle mt-2">{subheading}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="whitespace-nowrap lg:hidden" onClick={() => setFilterDrawerOpen(true)}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
              </Button>
              <Button className="whitespace-nowrap" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Post a Ride
              </Button>
            </div>
          </div>

          <div className="segmented-shell grid h-auto sm:h-20 sm:grid-cols-2">
            {[
              { value: "driver", label: "🚗 Available Rides", helper: "Drivers offering" },
              { value: "passenger", label: "👥 Rides Needed", helper: "Passengers looking" }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setView(option.value as "driver" | "passenger")}
                className={`segmented-option min-h-14 text-left ${
                  view === option.value
                    ? "segmented-option-active"
                    : "segmented-option-idle"
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {option.value === "driver" ? <Car className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                  {option.value === "driver" ? "Available Rides" : "Rides Needed"}
                </div>
                <div className="mt-1 text-[11px] opacity-70">{option.helper}</div>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {ridesQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="cortex-panel p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-3 w-24 rounded-full bg-black/10 dark:bg-white/10" />
                    <div className="h-4 w-2/3 rounded-full bg-black/8 dark:bg-white/8" />
                    <div className="h-3 w-full rounded-full bg-black/8 dark:bg-white/8" />
                    <div className="h-10 w-36 rounded-full bg-black/10 dark:bg-white/10" />
                  </div>
                </div>
              ))
            ) : rides.length ? (
              rides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onRequest={(nextRide) => {
                    setSelectedRide(nextRide);
                    setContactMode("request");
                  }}
                  onOffer={(nextRide) => {
                    setSelectedRide(nextRide);
                    setContactMode("offer");
                  }}
                />
              ))
            ) : (
              <div className="cortex-panel empty-state">
                <div className="font-display text-[2rem]">{view === "driver" ? "No rides posted yet." : "No ride requests yet."}</div>
                <p className="mt-3 text-sm leading-7 text-black/56 dark:text-white/58">
                  {view === "driver"
                    ? "Check back soon or post your own ride if you have seats open."
                    : "Post a request so nearby drivers know where you need to go."}
                </p>
                <div className="mt-6">
                  <Button onClick={() => setCreateOpen(true)}>Post a Ride</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block">
          <RidesFilterPanel
            view={view}
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(emptyFilters)}
          />
        </div>
      </div>

      {filterDrawerOpen ? (
        <div className="fixed inset-0 z-50 bg-black/36 p-4 backdrop-blur-[2px] lg:hidden">
          <div className="ml-auto h-full max-w-sm overflow-y-auto">
            <RidesFilterPanel
              view={view}
              filters={filters}
              onChange={setFilters}
              onClear={() => setFilters(emptyFilters)}
            />
            <Button className="mt-3 w-full" onClick={() => setFilterDrawerOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      ) : null}

      <CreateRidePostModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(ride) => {
          setToastMessage("Your ride has been posted!");
          void queryClient.invalidateQueries({ queryKey: ["rides"] });
          if (ride.postType !== view) {
            setView(ride.postType);
          }
        }}
      />

      <RideContactModal
        ride={selectedRide}
        mode={contactMode}
        onClose={() => setSelectedRide(null)}
        onSuccess={setToastMessage}
      />
    </AppShell>
  );
}
