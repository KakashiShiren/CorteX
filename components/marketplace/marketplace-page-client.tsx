"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Grid2X2, List, Plus, Settings, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { CheckoutModal } from "@/components/marketplace/checkout-modal";
import { MarketplaceCard } from "@/components/marketplace/marketplace-card";
import { MarketplaceDetailModal } from "@/components/marketplace/marketplace-detail-modal";
import {
  defaultMarketplaceFilters,
  getMarketplaceFilterCount,
  MarketplaceFilterPanel,
  type MarketplaceFilters
} from "@/components/marketplace/marketplace-filter-panel";
import { PostItemModal } from "@/components/marketplace/post-item-modal";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { MarketplaceItem } from "@/lib/marketplace";
import { useAuthSession } from "@/hooks/use-auth-session";

type MarketplaceResponse = {
  items: MarketplaceItem[];
  hasMore: boolean;
  total: number;
};

type SortOption = "newest" | "price_asc" | "price_desc" | "rating_desc" | "saved_desc";

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debounced;
}

function buildMarketplaceParams({
  filters,
  sort,
  mine
}: {
  filters: MarketplaceFilters;
  sort: SortOption;
  mine: boolean;
}) {
  const params = new URLSearchParams({
    page: "1",
    limit: "60",
    sort
  });

  if (mine) {
    params.set("mine", "true");
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.priceMin) {
    params.set("price_min", filters.priceMin);
  }

  if (filters.priceMax) {
    params.set("price_max", filters.priceMax);
  }

  if (filters.conditions.length) {
    params.set("condition", filters.conditions.join(","));
  }

  if (filters.shipping !== "all") {
    params.set("shipping", filters.shipping);
  }

  if (filters.ratingMin > 1) {
    params.set("rating_min", String(filters.ratingMin));
  }

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  return params;
}

function EmptyState({
  mine,
  onCreate
}: {
  mine: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="cortex-panel empty-state">
      <div className="font-display text-[2rem]">{mine ? "You haven't posted anything yet" : "No items found"}</div>
      <p className="mt-3 text-sm leading-7 text-black/56 dark:text-white/58">
        {mine
          ? "List something useful for your campus community and it will appear here."
          : "Try a different category, price, or search term."}
      </p>
      {mine ? (
        <div className="mt-6">
          <Button onClick={onCreate}>List your first item</Button>
        </div>
      ) : null}
    </div>
  );
}

export function MarketplacePageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const meQuery = useAuthSession();
  const currentUser = meQuery.data;
  const [view, setView] = useState<"browse" | "mine">("browse");
  const [filters, setFilters] = useState<MarketplaceFilters>({ ...defaultMarketplaceFilters });
  const debouncedFilters = useDebouncedValue(filters, 300);
  const [sort, setSort] = useState<SortOption>("newest");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<MarketplaceItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeFilterCount = useMemo(() => getMarketplaceFilterCount(filters), [filters]);
  const searchParams = useMemo(
    () => buildMarketplaceParams({ filters: debouncedFilters, sort, mine: view === "mine" }),
    [debouncedFilters, sort, view]
  );
  const marketplaceQuery = useQuery({
    queryKey: ["marketplace", searchParams.toString()],
    queryFn: () => apiFetch<MarketplaceResponse>(`/api/marketplace?${searchParams.toString()}`),
    enabled: Boolean(currentUser?.id),
    staleTime: 20_000
  });

  const items = marketplaceQuery.data?.items ?? [];

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setToastMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const refreshMarketplace = () => {
    void queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    void queryClient.invalidateQueries({ queryKey: ["marketplace-summary"] });
    if (selectedItem) {
      void queryClient.invalidateQueries({ queryKey: ["marketplace-item", selectedItem.id] });
    }
  };

  const handleToggleSave = async (item: MarketplaceItem) => {
    try {
      await apiFetch<{ saved: boolean; savesCount: number }>(`/api/marketplace/${item.id}/save`, {
        method: item.viewerHasSaved ? "DELETE" : "POST"
      });
      setToastMessage(item.viewerHasSaved ? "Removed from favorites." : "Saved to favorites.");
      refreshMarketplace();
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Unable to update favorite.");
    }
  };

  const handleMessage = async (item: MarketplaceItem) => {
    try {
      const conversation = await apiFetch<{ id: string }>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ peerId: item.userId })
      });
      router.push(`/messages/${conversation.id}`);
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Unable to open messages.");
    }
  };

  const handleDelete = async (item: MarketplaceItem) => {
    if (!window.confirm(`Delete "${item.title}"?`)) {
      return;
    }

    try {
      await apiFetch<{ success: boolean }>(`/api/marketplace/${item.id}`, {
        method: "DELETE"
      });
      setToastMessage("Listing deleted.");
      refreshMarketplace();
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Unable to delete listing.");
    }
  };

  const handleMarkSold = async (item: MarketplaceItem) => {
    try {
      await apiFetch<MarketplaceItem>(`/api/marketplace/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "sold" })
      });
      setToastMessage("Listing marked as sold.");
      refreshMarketplace();
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Unable to mark item as sold.");
    }
  };

  return (
    <AppShell>
      {toastMessage ? <div className="toast-surface">{toastMessage}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="page-kicker">Marketplace</div>
              <h1 className="mt-3 font-display text-[32px] leading-none sm:text-[2.6rem]">Marketplace</h1>
              <p className="mt-2 text-[13px] leading-6 text-black/56 dark:text-white/58">Buy and sell with your campus community</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" className="lg:hidden" onClick={() => setFilterDrawerOpen(true)}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
              </Button>
              {view === "mine" ? (
                <Button variant="secondary" onClick={() => router.push("/marketplace/seller/dashboard")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              ) : null}
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Post New Item
              </Button>
            </div>
          </div>

          <div className="segmented-shell grid sm:grid-cols-2">
            {[
              { value: "browse", label: "Browse Items" },
              { value: "mine", label: "My Listings" }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setView(option.value as "browse" | "mine")}
                className={`segmented-option h-14 text-sm font-semibold ${
                  view === option.value ? "segmented-option-active" : "segmented-option-idle"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-[22px] border border-black/8 bg-white/42 p-3 dark:border-white/10 dark:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="h-11 rounded-full border border-black/8 bg-[#fffaf3]/88 px-4 text-sm text-cortex-ink outline-none dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="rating_desc">Rating: highest first</option>
              <option value="saved_desc">Most saved</option>
            </select>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLayout("grid")}
                className={`grid h-11 w-11 place-items-center rounded-full border transition ${
                  layout === "grid"
                    ? "border-cortex-ink bg-cortex-ink text-cortex-parchment dark:border-white dark:bg-white dark:text-cortex-ink"
                    : "border-black/8 bg-white/44 text-black/58 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/58"
                }`}
                aria-label="Grid view"
              >
                <Grid2X2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setLayout("list")}
                className={`grid h-11 w-11 place-items-center rounded-full border transition ${
                  layout === "list"
                    ? "border-cortex-ink bg-cortex-ink text-cortex-parchment dark:border-white dark:bg-white dark:text-cortex-ink"
                    : "border-black/8 bg-white/44 text-black/58 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/58"
                }`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {marketplaceQuery.isLoading ? (
            <div className={layout === "grid" ? "grid gap-4 md:grid-cols-2 2xl:grid-cols-3" : "space-y-4"}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[390px] animate-pulse rounded-[24px] border border-black/8 bg-white/44 dark:border-white/10 dark:bg-white/[0.04]" />
              ))}
            </div>
          ) : items.length ? (
            <div className={layout === "grid" ? "grid gap-4 md:grid-cols-2 2xl:grid-cols-3" : "space-y-4"}>
              {items.map((item) => (
                <MarketplaceCard
                  key={item.id}
                  item={item}
                  mode={view === "mine" ? "mine" : "browse"}
                  isListView={layout === "list"}
                  onOpen={(nextItem) => setSelectedItem(nextItem)}
                  onToggleSave={handleToggleSave}
                  onMessage={handleMessage}
                  onEdit={(nextItem) => setEditingItem(nextItem)}
                  onDelete={handleDelete}
                  onMarkSold={handleMarkSold}
                />
              ))}
            </div>
          ) : (
            <EmptyState mine={view === "mine"} onCreate={() => setCreateOpen(true)} />
          )}
        </div>

        <div className="hidden lg:block">
          <MarketplaceFilterPanel
            filters={filters}
            total={marketplaceQuery.data?.total ?? 0}
            onChange={setFilters}
            onClear={() => setFilters({ ...defaultMarketplaceFilters })}
          />
        </div>
      </div>

      {filterDrawerOpen ? (
        <div className="fixed inset-0 z-50 bg-black/36 p-4 backdrop-blur-[2px] lg:hidden">
          <div className="ml-auto h-full max-w-sm overflow-y-auto">
            <MarketplaceFilterPanel
              filters={filters}
              total={marketplaceQuery.data?.total ?? 0}
              onChange={setFilters}
              onClear={() => setFilters({ ...defaultMarketplaceFilters })}
            />
            <Button className="mt-3 w-full" onClick={() => setFilterDrawerOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      ) : null}

      <PostItemModal
        open={createOpen || Boolean(editingItem)}
        item={editingItem}
        onClose={() => {
          setCreateOpen(false);
          setEditingItem(null);
        }}
        onSaved={(item) => {
          setToastMessage(item.status === "draft" ? "Draft saved." : "Your item is live!");
          setView("mine");
          refreshMarketplace();
        }}
      />

      <MarketplaceDetailModal
        itemId={selectedItem?.id ?? null}
        fallbackItem={selectedItem}
        currentUserId={currentUser?.id}
        onClose={() => setSelectedItem(null)}
        onBuy={(item) => setCheckoutItem(item)}
        onMessage={handleMessage}
        onToggleSave={handleToggleSave}
        onToast={setToastMessage}
      />

      <CheckoutModal
        item={checkoutItem}
        userEmail={currentUser?.email}
        onClose={() => setCheckoutItem(null)}
        onSuccess={(message) => {
          setToastMessage(message);
          refreshMarketplace();
        }}
      />
    </AppShell>
  );
}
