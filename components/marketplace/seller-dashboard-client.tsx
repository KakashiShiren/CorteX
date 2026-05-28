"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, Pencil, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { MarketplaceCard } from "@/components/marketplace/marketplace-card";
import { PostItemModal } from "@/components/marketplace/post-item-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { MarketplaceItem } from "@/lib/marketplace";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useState } from "react";

type Summary = {
  activeListings: number;
  salesCount: number;
  revenue: number;
  earnings: number;
  followers: number;
};

type MarketplaceResponse = {
  items: MarketplaceItem[];
  total: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function SellerDashboardClient() {
  const queryClient = useQueryClient();
  const meQuery = useAuthSession();
  const currentUser = meQuery.data;
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [shippingPolicy, setShippingPolicy] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");

  const summaryQuery = useQuery({
    queryKey: ["marketplace-summary"],
    queryFn: () => apiFetch<Summary>("/api/marketplace/summary"),
    enabled: Boolean(currentUser?.id)
  });

  const listingsQuery = useQuery({
    queryKey: ["marketplace-seller-listings"],
    queryFn: () => apiFetch<MarketplaceResponse>("/api/marketplace?mine=true&limit=80"),
    enabled: Boolean(currentUser?.id)
  });

  const listings = listingsQuery.data?.items ?? [];
  const summary = summaryQuery.data;
  const joined = currentUser?.createdAt
    ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(currentUser.createdAt))
    : "Recently";

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    void queryClient.invalidateQueries({ queryKey: ["marketplace-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["marketplace-seller-listings"] });
  };

  const updateItemStatus = async (item: MarketplaceItem, status: "sold" | "active") => {
    try {
      await apiFetch<MarketplaceItem>(`/api/marketplace/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      setToastMessage(status === "sold" ? "Listing marked as sold." : "Listing reactivated.");
      refresh();
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Unable to update listing.");
    }
  };

  const deleteItem = async (item: MarketplaceItem) => {
    if (!window.confirm(`Delete "${item.title}"?`)) {
      return;
    }

    try {
      await apiFetch(`/api/marketplace/${item.id}`, { method: "DELETE" });
      setToastMessage("Listing deleted.");
      refresh();
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Unable to delete listing.");
    }
  };

  return (
    <AppShell>
      {toastMessage ? <div className="toast-surface">{toastMessage}</div> : null}

      <div className="space-y-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="page-kicker">Seller Dashboard</div>
            <h1 className="page-title mt-3">Marketplace account</h1>
            <p className="page-subtitle mt-3">Track listings, sales, and seller settings from one calm place.</p>
          </div>
          <Button onClick={() => window.history.back()}>Back to Marketplace</Button>
        </div>

        <section className="cortex-panel p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-display text-3xl">{currentUser?.name ?? "Grove Seller"}</div>
              <div className="mt-2 text-sm text-black/56 dark:text-white/58">Joined {joined} · ★ 5.0 with 0 reviews · 100% response rate</div>
            </div>
            <Button variant="secondary">Review all reviews</Button>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Sales", String(summary?.salesCount ?? 0)],
            ["Revenue", formatCurrency(summary?.revenue ?? 0)],
            ["Earnings", formatCurrency(summary?.earnings ?? 0)],
            ["Followers", String(summary?.followers ?? 0)]
          ].map(([label, value]) => (
            <div key={label} className="cortex-panel p-6">
              <div className="micro-label">{label}</div>
              <div className="mt-3 font-display text-4xl">{value}</div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="eyebrow">Listings</div>
              <div className="mt-2 text-xl font-semibold">Your active listings</div>
            </div>
          </div>

          {listingsQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-[360px] animate-pulse rounded-[24px] border border-black/8 bg-white/44 dark:border-white/10 dark:bg-white/[0.04]" />
              ))}
            </div>
          ) : listings.length ? (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {listings.map((item) => (
                <div key={item.id} className="space-y-3">
                  <MarketplaceCard
                    item={item}
                    mode="mine"
                    onOpen={() => setEditingItem(item)}
                    onEdit={() => setEditingItem(item)}
                    onDelete={deleteItem}
                    onMarkSold={() => void updateItemStatus(item, "sold")}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditingItem(item)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => void updateItemStatus(item, "sold")}>
                      <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                      Sold
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setToastMessage(`${item.viewsCount} views · ${item.savesCount} saves · ${item.interestedCount} messages`)}>
                      <BarChart3 className="mr-2 h-3.5 w-3.5" />
                      Stats
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="cortex-panel empty-state">
              <div className="font-display text-[2rem]">No listings yet.</div>
              <p className="mt-3 text-sm leading-7 text-black/56 dark:text-white/58">Post your first item from Marketplace to start selling.</p>
            </div>
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="cortex-panel p-6 sm:p-8">
            <div className="eyebrow">Settings</div>
            <div className="mt-3 text-2xl font-semibold">Seller profile info</div>
            <div className="mt-6 space-y-4">
              <Textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Profile bio" />
              <Textarea value={shippingPolicy} onChange={(event) => setShippingPolicy(event.target.value)} placeholder="Shipping policy" />
              <Textarea value={returnPolicy} onChange={(event) => setReturnPolicy(event.target.value)} placeholder="Return policy" />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-black/62 dark:text-white/64">
                  <input type="radio" name="contactPreference" defaultChecked className="accent-[#3f5f55]" />
                  Direct message
                </label>
                <label className="flex items-center gap-2 text-sm text-black/62 dark:text-white/64">
                  <input type="radio" name="contactPreference" className="accent-[#3f5f55]" />
                  Phone
                </label>
              </div>
              <Button variant="secondary" onClick={() => setToastMessage("Seller settings saved locally for now.")}>Save Seller Settings</Button>
            </div>
          </div>

          <div className="cortex-panel p-6">
            <div className="eyebrow">Premium Seller</div>
            <div className="mt-3 text-2xl font-semibold">Currently free</div>
            <p className="mt-3 text-sm leading-7 text-black/58 dark:text-white/60">
              Premium infrastructure is ready for a future $9.99/month plan with featured badges, higher search placement, bulk uploads, and analytics.
            </p>
            <Button className="mt-5 w-full" disabled>Upgrade to Premium</Button>
          </div>
        </section>
      </div>

      <PostItemModal
        open={Boolean(editingItem)}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSaved={() => {
          setToastMessage("Listing updated.");
          refresh();
        }}
      />
    </AppShell>
  );
}
