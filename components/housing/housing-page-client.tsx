"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { List, Map, Plus, SlidersHorizontal } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { CreateHousingPostModal } from "@/components/housing/create-housing-post-modal";
import { HousingCard } from "@/components/housing/housing-card";
import { HousingDetailModal } from "@/components/housing/housing-detail-modal";
import {
  defaultHousingFilters,
  getHousingFilterCount,
  HousingFilterPanel,
  type HousingFilters
} from "@/components/housing/housing-filter-panel";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { HousingPost } from "@/lib/housing";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAuthSession } from "@/hooks/use-auth-session";

const HousingMap = dynamic(() => import("@/components/housing/housing-map").then((module) => module.HousingMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[620px] items-center justify-center text-sm text-black/56 dark:text-white/58">
      Loading housing map...
    </div>
  )
});

type HousingResponse = {
  listings: HousingPost[];
  hasMore: boolean;
  total: number;
};

type GeocodeResponse = {
  lat: number;
  lng: number;
  formatted_address: string;
};

function buildHousingSearchParams(filters: HousingFilters) {
  const params = new URLSearchParams({
    lat: String(filters.lat),
    lng: String(filters.lng),
    radius: String(filters.radius),
    price_min: filters.priceMin || "300",
    price_max: filters.priceMax || "3000",
    bedrooms: filters.bedrooms,
    bathrooms: filters.bathrooms,
    lease_type: filters.leaseType,
    limit: "60",
    page: "1"
  });

  if (filters.amenities.length) {
    params.set("amenities", filters.amenities.join(","));
  }

  if (filters.availableFrom) {
    params.set("available_from", filters.availableFrom);
  }

  if (filters.locationQuery && filters.lat === 0 && filters.lng === 0) {
    params.set("location", filters.locationQuery);
  }

  return params;
}

function getStoredFavorites() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem("grove:housing-favorites") ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function announceHousingFilterCount(count: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("grove-nav-filter-count:housing", String(count));
  window.dispatchEvent(
    new CustomEvent("grove-nav-filter-count", {
      detail: {
        href: "/housing",
        count
      }
    })
  );
}

export function HousingPageClient() {
  const queryClient = useQueryClient();
  const meQuery = useAuthSession();
  const currentUser = meQuery.data;
  const [view, setView] = useState<"list" | "map">("list");
  const [filters, setFilters] = useState<HousingFilters>({ ...defaultHousingFilters });
  const [createOpen, setCreateOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<HousingPost | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const activeFilterCount = useMemo(() => getHousingFilterCount(filters), [filters]);
  const searchParams = useMemo(() => buildHousingSearchParams(filters), [filters]);
  const housingQuery = useQuery({
    queryKey: ["housing", searchParams.toString()],
    queryFn: () => apiFetch<HousingResponse>(`/api/housing/search?${searchParams.toString()}`),
    enabled: Boolean(currentUser?.id),
    staleTime: 20_000
  });

  const listings = housingQuery.data?.listings ?? [];

  useEffect(() => {
    setFavoriteIds(getStoredFavorites());
  }, []);

  useEffect(() => {
    announceHousingFilterCount(activeFilterCount);
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
      .channel(`housing-feed:${currentUser.universityId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "housing_posts",
          filter: `university_id=eq.${currentUser.universityId}`
        },
        () => {
          setToastMessage("New housing listing added.");
          void queryClient.invalidateQueries({ queryKey: ["housing"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUser?.universityId, queryClient]);

  const setFavorites = (nextIds: string[]) => {
    setFavoriteIds(nextIds);
    window.localStorage.setItem("grove:housing-favorites", JSON.stringify(nextIds));
  };

  const handleToggleFavorite = (listing: HousingPost) => {
    setFavorites(
      favoriteIds.includes(listing.id)
        ? favoriteIds.filter((id) => id !== listing.id)
        : [...favoriteIds, listing.id]
    );
  };

  const handleInquire = async (listing: HousingPost) => {
    try {
      await apiFetch<{ success: boolean }>(`/api/housing/${listing.id}/inquire`, {
        method: "POST",
        body: JSON.stringify({
          message: `Hi ${listing.author.name}, I am interested in ${listing.title}.`
        })
      });
      setToastMessage(`Inquiry sent to ${listing.author.name}!`);
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Unable to send inquiry.");
    }
  };

  const handleGeocode = async () => {
    const query = filters.locationQuery.trim();
    if (!query) {
      return;
    }

    setIsGeocoding(true);
    try {
      const result = await apiFetch<GeocodeResponse>(`/api/housing/geocode?address=${encodeURIComponent(query)}`);
      setFilters((current) => ({
        ...current,
        lat: result.lat,
        lng: result.lng,
        matchedLabel: result.formatted_address.includes("Clark University") ? "Clark University" : result.formatted_address,
        locationQuery: query
      }));
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Unable to geocode that location.");
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <AppShell>
      {toastMessage ? <div className="toast-surface">{toastMessage}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="page-kicker">Housing</div>
              <h1 className="page-title mt-3">Find Off-Campus Housing</h1>
              <p className="page-subtitle mt-2">
                Browse available houses near Clark University
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="lg:hidden" onClick={() => setFilterDrawerOpen(true)}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
              </Button>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Post
              </Button>
            </div>
          </div>

          <div className="segmented-shell grid sm:grid-cols-2">
            {[
              { value: "list", label: "📋 List View" },
              { value: "map", label: "🗺️ Map View" }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setView(option.value as "list" | "map")}
                className={`segmented-option h-14 text-sm font-semibold ${
                  view === option.value
                    ? "segmented-option-active"
                    : "segmented-option-idle"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {option.value === "list" ? <List className="h-4 w-4" /> : <Map className="h-4 w-4" />}
                  {option.value === "list" ? "List View" : "Map View"}
                </span>
              </button>
            ))}
          </div>

          {view === "map" ? (
            <div className="cortex-panel hidden h-[680px] overflow-hidden md:block">
              <HousingMap listings={listings} center={{ lat: filters.lat, lng: filters.lng }} onSelect={setSelectedListing} />
            </div>
          ) : null}

          {view === "map" ? (
            <div className="cortex-panel p-6 text-sm text-black/58 dark:text-white/60 md:hidden">
              Map view is available on tablet and desktop. Showing listings below.
            </div>
          ) : null}

          {view === "list" || view === "map" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {housingQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="cortex-panel h-[360px] animate-pulse rounded-[12px] p-5">
                    <div className="h-[180px] rounded-[12px] bg-black/10 dark:bg-white/10" />
                    <div className="mt-4 h-4 w-3/4 rounded-full bg-black/10 dark:bg-white/10" />
                    <div className="mt-3 h-3 w-full rounded-full bg-black/8 dark:bg-white/8" />
                  </div>
                ))
              ) : listings.length ? (
                listings.map((listing) => (
                  <HousingCard
                    key={listing.id}
                    listing={listing}
                    isFavorite={favoriteIds.includes(listing.id)}
                    onOpen={setSelectedListing}
                    onToggleFavorite={handleToggleFavorite}
                    onInquire={handleInquire}
                  />
                ))
              ) : (
                <div className="cortex-panel empty-state xl:col-span-2">
                  <div className="font-display text-[2rem]">No housing posted yet.</div>
                  <p className="mt-3 text-sm leading-7 text-black/56 dark:text-white/58">
                    Try widening your radius or post the first listing for your campus community.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => setCreateOpen(true)}>Post Your Property</Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="hidden lg:block">
          <HousingFilterPanel
            filters={filters}
            total={housingQuery.data?.total ?? 0}
            isGeocoding={isGeocoding}
            onChange={setFilters}
            onClear={() => setFilters({ ...defaultHousingFilters })}
            onGeocode={handleGeocode}
          />
        </div>
      </div>

      {filterDrawerOpen ? (
        <div className="fixed inset-0 z-50 bg-black/36 p-4 backdrop-blur-[2px] lg:hidden">
          <div className="ml-auto h-full max-w-sm overflow-y-auto">
            <HousingFilterPanel
              filters={filters}
              total={housingQuery.data?.total ?? 0}
              isGeocoding={isGeocoding}
              onChange={setFilters}
              onClear={() => setFilters({ ...defaultHousingFilters })}
              onGeocode={handleGeocode}
            />
            <Button className="mt-3 w-full" onClick={() => setFilterDrawerOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      ) : null}

      <CreateHousingPostModal
        open={createOpen}
        currentUserEmail={currentUser?.email}
        onClose={() => setCreateOpen(false)}
        onCreated={(listing) => {
          setToastMessage(listing.status === "draft" ? "Draft saved." : "Your listing is live!");
          void queryClient.invalidateQueries({ queryKey: ["housing"] });
        }}
      />

      <HousingDetailModal
        listing={selectedListing}
        currentUserId={currentUser?.id}
        currentUserName={currentUser?.name ?? "Grove Student"}
        currentUserImageUrl={currentUser?.profilePictureUrl}
        isFavorite={selectedListing ? favoriteIds.includes(selectedListing.id) : false}
        onClose={() => setSelectedListing(null)}
        onToggleFavorite={handleToggleFavorite}
        onInquire={handleInquire}
        onError={setToastMessage}
      />
    </AppShell>
  );
}
