import type { SupabaseClient } from "@supabase/supabase-js";

import { parseAvatarProfilePicture } from "@/lib/avatar-colors";
import type { AvatarColorPreset } from "@/lib/types";
import { getCurrentUserUniversityId as getUserUniversityId } from "@/lib/university";

export const marketplaceCategories = [
  "Books & Textbooks",
  "Furniture & Dorm",
  "Electronics",
  "Clothing & Accessories",
  "Bikes & Transportation",
  "Kitchen & Appliances",
  "Sports & Fitness",
  "Other"
] as const;

export const marketplaceConditions = ["Like New", "Good", "Fair", "For Parts"] as const;

export type MarketplaceCategory = (typeof marketplaceCategories)[number];
export type MarketplaceCondition = (typeof marketplaceConditions)[number];
export type MarketplaceSort = "newest" | "price_asc" | "price_desc" | "rating_desc" | "saved_desc";
export type MarketplaceView = "browse" | "mine";

export interface MarketplaceSeller {
  id: string;
  name: string;
  major?: string;
  year?: string;
  profilePictureUrl?: string;
  avatarColor?: AvatarColorPreset;
  createdAt?: string;
  rating: number;
  reviewsCount: number;
  responseTime: string;
}

export interface MarketplaceReview {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    profilePictureUrl?: string;
    avatarColor?: AvatarColorPreset;
  };
}

export interface MarketplaceItem {
  id: string;
  userId: string;
  universityId?: string;
  title: string;
  description?: string;
  category: string;
  condition?: string;
  price: number;
  imageUrls: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  featuredUntil?: string | null;
  shippingAvailable: boolean;
  localPickup: boolean;
  status: string;
  contactPreference: string;
  contactPhone?: string;
  allowsNegotiation: boolean;
  specifications: Record<string, string>;
  viewsCount: number;
  savesCount: number;
  createdAt: string;
  updatedAt: string;
  seller: MarketplaceSeller;
  viewerHasSaved: boolean;
  interestedCount: number;
}

export interface MarketplaceItemDetail extends MarketplaceItem {
  reviews: MarketplaceReview[];
  totalReviews: number;
  viewerCanReview: boolean;
  viewerReviewOrderId?: string;
}

export type MarketplaceItemRow = {
  id: string;
  user_id: string;
  university_id: string | null;
  title: string;
  description: string | null;
  category: string;
  condition: string | null;
  price: number | string;
  image_urls: string[] | null;
  is_available: boolean | null;
  is_featured: boolean | null;
  featured_until: string | null;
  shipping_available: boolean | null;
  local_pickup: boolean | null;
  status: string | null;
  contact_preference: string | null;
  contact_phone: string | null;
  allows_negotiation: boolean | null;
  specifications: unknown;
  views_count: number | null;
  saves_count: number | null;
  created_at: string;
  updated_at: string;
};

type UserRow = {
  id: string;
  name: string;
  major: string | null;
  year: string | null;
  profile_picture_url: string | null;
  created_at: string;
};

type SaveRow = {
  item_id: string;
};

type RatingRow = {
  reviewee_id: string;
  rating: number | null;
};

type ReviewRow = {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
};

type OrderRow = {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  status: string | null;
};

export const marketplaceItemSelect =
  "id, user_id, university_id, title, description, category, condition, price, image_urls, is_available, is_featured, featured_until, shipping_available, local_pickup, status, contact_preference, contact_phone, allows_negotiation, specifications, views_count, saves_count, created_at, updated_at";

export function normalizeTimestamp(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
}

export function isMarketplaceCategory(value: string | null | undefined): value is MarketplaceCategory {
  return Boolean(value && marketplaceCategories.includes(value as MarketplaceCategory));
}

export function isMarketplaceCondition(value: string | null | undefined): value is MarketplaceCondition {
  return Boolean(value && marketplaceConditions.includes(value as MarketplaceCondition));
}

export function isMarketplaceSort(value: string | null | undefined): value is MarketplaceSort {
  return value === "newest" || value === "price_asc" || value === "price_desc" || value === "rating_desc" || value === "saved_desc";
}

export function normalizeSpecifications(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => [key.trim(), String(entry ?? "").trim()])
      .filter(([key, entry]) => key && entry)
  );
}

export async function getCurrentUserUniversityId(supabase: SupabaseClient, userId: string) {
  return getUserUniversityId(supabase, userId);
}

function getDefaultSeller(id: string): MarketplaceSeller {
  return {
    id,
    name: "Grove student",
    rating: 5,
    reviewsCount: 0,
    responseTime: "Usually responds in a few hours"
  };
}

function buildSellerMap(users: UserRow[], ratings: RatingRow[]) {
  const ratingBuckets = new Map<string, { total: number; count: number }>();

  for (const rating of ratings) {
    if (!rating.rating) {
      continue;
    }

    const bucket = ratingBuckets.get(rating.reviewee_id) ?? { total: 0, count: 0 };
    bucket.total += rating.rating;
    bucket.count += 1;
    ratingBuckets.set(rating.reviewee_id, bucket);
  }

  return new Map(
    users.map((user) => {
      const avatar = parseAvatarProfilePicture(user.profile_picture_url);
      const rating = ratingBuckets.get(user.id);
      const averageRating = rating?.count ? Math.round((rating.total / rating.count) * 10) / 10 : 5;

      return [
        user.id,
        {
          id: user.id,
          name: user.name,
          major: user.major ?? undefined,
          year: user.year ?? undefined,
          profilePictureUrl: avatar.profilePictureUrl,
          avatarColor: avatar.avatarColor,
          createdAt: normalizeTimestamp(user.created_at),
          rating: averageRating,
          reviewsCount: rating?.count ?? 0,
          responseTime: "Usually responds in 2 hours"
        } satisfies MarketplaceSeller
      ];
    })
  );
}

export async function hydrateMarketplaceItems(
  supabase: SupabaseClient,
  rows: MarketplaceItemRow[],
  viewerId?: string
): Promise<MarketplaceItem[]> {
  if (!rows.length) {
    return [];
  }

  const sellerIds = [...new Set(rows.map((row) => row.user_id))];
  const itemIds = rows.map((row) => row.id);

  const [usersQuery, ratingsQuery, savesQuery] = await Promise.all([
    supabase.from("users").select("id, name, major, year, profile_picture_url, created_at").in("id", sellerIds),
    sellerIds.length
      ? supabase.from("marketplace_reviews").select("reviewee_id, rating").in("reviewee_id", sellerIds)
      : Promise.resolve({ data: [], error: null }),
    viewerId
      ? supabase.from("marketplace_saves").select("item_id").eq("user_id", viewerId).in("item_id", itemIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (usersQuery.error) {
    throw new Error(usersQuery.error.message);
  }

  if (ratingsQuery.error) {
    throw new Error(ratingsQuery.error.message);
  }

  if (savesQuery.error) {
    throw new Error(savesQuery.error.message);
  }

  const sellerMap = buildSellerMap((usersQuery.data ?? []) as UserRow[], (ratingsQuery.data ?? []) as RatingRow[]);
  const savedIds = new Set(((savesQuery.data ?? []) as SaveRow[]).map((row) => row.item_id));

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    universityId: row.university_id ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    category: row.category,
    condition: row.condition ?? undefined,
    price: Number(row.price),
    imageUrls: row.image_urls ?? [],
    isAvailable: row.is_available ?? true,
    isFeatured: row.is_featured ?? false,
    featuredUntil: normalizeTimestamp(row.featured_until) ?? null,
    shippingAvailable: Boolean(row.shipping_available),
    localPickup: row.local_pickup ?? true,
    status: row.status ?? (row.is_available === false ? "sold" : "active"),
    contactPreference: row.contact_preference ?? "direct_message",
    contactPhone: row.contact_phone ?? undefined,
    allowsNegotiation: Boolean(row.allows_negotiation),
    specifications: normalizeSpecifications(row.specifications),
    viewsCount: row.views_count ?? 0,
    savesCount: row.saves_count ?? 0,
    createdAt: normalizeTimestamp(row.created_at) ?? new Date().toISOString(),
    updatedAt: normalizeTimestamp(row.updated_at) ?? new Date().toISOString(),
    seller: sellerMap.get(row.user_id) ?? getDefaultSeller(row.user_id),
    viewerHasSaved: savedIds.has(row.id),
    interestedCount: row.saves_count ?? 0
  }));
}

export async function hydrateMarketplaceReviews(supabase: SupabaseClient, rows: ReviewRow[]): Promise<MarketplaceReview[]> {
  if (!rows.length) {
    return [];
  }

  const reviewerIds = [...new Set(rows.map((row) => row.reviewer_id))];
  const usersQuery = await supabase
    .from("users")
    .select("id, name, profile_picture_url")
    .in("id", reviewerIds);

  if (usersQuery.error) {
    throw new Error(usersQuery.error.message);
  }

  const userMap = new Map(
    ((usersQuery.data ?? []) as Array<{ id: string; name: string; profile_picture_url: string | null }>).map((user) => {
      const avatar = parseAvatarProfilePicture(user.profile_picture_url);
      return [
        user.id,
        {
          id: user.id,
          name: user.name,
          profilePictureUrl: avatar.profilePictureUrl,
          avatarColor: avatar.avatarColor
        }
      ];
    })
  );

  return rows.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    reviewerId: row.reviewer_id,
    revieweeId: row.reviewee_id,
    rating: row.rating ?? 5,
    comment: row.comment ?? undefined,
    createdAt: normalizeTimestamp(row.created_at) ?? new Date().toISOString(),
    reviewer:
      userMap.get(row.reviewer_id) ?? {
        id: row.reviewer_id,
        name: "Grove student"
      }
  }));
}

export async function hydrateMarketplaceItemDetail(
  supabase: SupabaseClient,
  row: MarketplaceItemRow,
  viewerId: string
): Promise<MarketplaceItemDetail> {
  const [item] = await hydrateMarketplaceItems(supabase, [row], viewerId);
  const ordersQuery = await supabase
    .from("marketplace_orders")
    .select("id, item_id, buyer_id, seller_id, status")
    .eq("item_id", row.id);

  if (ordersQuery.error) {
    throw new Error(ordersQuery.error.message);
  }

  const orders = (ordersQuery.data ?? []) as OrderRow[];
  const orderIds = orders.map((order) => order.id);
  const reviewsQuery = orderIds.length
    ? await supabase
        .from("marketplace_reviews")
        .select("id, order_id, reviewer_id, reviewee_id, rating, comment, created_at")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (reviewsQuery.error) {
    throw new Error(reviewsQuery.error.message);
  }

  const reviews = await hydrateMarketplaceReviews(supabase, (reviewsQuery.data ?? []) as ReviewRow[]);
  const reviewedOrderIds = new Set(reviews.map((review) => review.orderId));
  const reviewableOrder = orders.find(
    (order) => order.buyer_id === viewerId && order.status === "completed" && !reviewedOrderIds.has(order.id)
  );

  return {
    ...item,
    reviews: reviews.slice(0, 3),
    totalReviews: reviews.length,
    viewerCanReview: Boolean(reviewableOrder),
    viewerReviewOrderId: reviewableOrder?.id
  };
}
