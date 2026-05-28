import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getCurrentUserUniversityId,
  getDistance,
  hydrateHousingPosts,
  housingPostSelect,
  type HousingPostRow
} from "@/lib/housing";

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value ?? fallback);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function parseNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseAmenities(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function applyBedroomFilter(query: any, bedrooms: string | null) {
  if (!bedrooms || bedrooms === "any") {
    return query;
  }

  if (bedrooms === "4" || bedrooms === "4+") {
    return query.gte("bedrooms", 4);
  }

  const parsed = Number(bedrooms);
  return Number.isFinite(parsed) ? query.eq("bedrooms", parsed) : query;
}

function applyBathroomFilter(query: any, bathrooms: string | null) {
  if (!bathrooms || bathrooms === "any") {
    return query;
  }

  if (bathrooms === "2.5" || bathrooms === "2.5+") {
    return query.gte("bathrooms", 2.5);
  }

  const parsed = Number(bathrooms);
  return Number.isFinite(parsed) ? query.eq("bathrooms", parsed) : query;
}

export async function searchHousingListings({
  supabase,
  userId,
  searchParams
}: {
  supabase: SupabaseClient;
  userId: string;
  searchParams: URLSearchParams;
}) {
  const universityId = await getCurrentUserUniversityId(supabase, userId);
  if (!universityId) {
    throw new Error("Your campus workspace is still being prepared.");
  }

  const page = parsePositiveInt(searchParams.get("page"), 1, 500);
  const limit = parsePositiveInt(searchParams.get("limit"), 20, 60);
  const lat = parseNumber(searchParams.get("lat"));
  const lng = parseNumber(searchParams.get("lng"));
  const radius = parseNumber(searchParams.get("radius")) ?? 2;
  const priceMin = parseNumber(searchParams.get("price_min"));
  const priceMax = parseNumber(searchParams.get("price_max"));
  const bedrooms = searchParams.get("bedrooms");
  const bathrooms = searchParams.get("bathrooms");
  const leaseType = searchParams.get("lease_type");
  const availableFrom = searchParams.get("available_from");
  const locationQuery = searchParams.get("location")?.trim();
  const amenities = parseAmenities(searchParams.get("amenities"));

  let query = supabase
    .from("housing_posts")
    .select(housingPostSelect)
    .eq("university_id", universityId)
    .eq("status", "active");

  if (locationQuery) {
    query = query.ilike("location", `%${locationQuery}%`);
  }

  if (priceMin !== null) {
    query = query.gte("price_per_month", priceMin);
  }

  if (priceMax !== null) {
    query = query.lte("price_per_month", priceMax);
  }

  query = applyBedroomFilter(query, bedrooms);
  query = applyBathroomFilter(query, bathrooms);

  if (amenities.length) {
    query = query.overlaps("amenities", amenities);
  }

  if (leaseType && leaseType !== "any") {
    query = query.eq("lease_length", leaseType);
  }

  if (availableFrom) {
    query = query.gte("available_from", availableFrom);
  }

  const result = await query.order("created_at", { ascending: false }).limit(500);

  if (result.error) {
    throw new Error(result.error.message);
  }

  const rows = (result.data ?? []) as HousingPostRow[];
  const distances = new Map<string, number>();
  const filteredRows =
    lat !== null && lng !== null
      ? rows
          .filter((row) => {
            if (row.latitude === null || row.longitude === null) {
              return false;
            }

            const distance = getDistance(lat, lng, Number(row.latitude), Number(row.longitude));
            distances.set(row.id, distance);
            return distance <= radius;
          })
          .sort((left, right) => (distances.get(left.id) ?? 0) - (distances.get(right.id) ?? 0))
      : rows;

  const from = (page - 1) * limit;
  const pageRows = filteredRows.slice(from, from + limit);
  const listings = await hydrateHousingPosts(supabase, pageRows, distances);

  return {
    listings,
    hasMore: filteredRows.length > from + listings.length,
    total: filteredRows.length
  };
}
