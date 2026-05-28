import { fail, ok, requireUserId } from "@/lib/http";
import {
  getCurrentUserUniversityId,
  hydrateMarketplaceItems,
  isMarketplaceCategory,
  isMarketplaceCondition,
  isMarketplaceSort,
  marketplaceItemSelect,
  normalizeSpecifications,
  type MarketplaceItemRow,
  type MarketplaceSort
} from "@/lib/marketplace";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function isUuid(value: string | null | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

function sortItems(sort: MarketplaceSort, items: Awaited<ReturnType<typeof hydrateMarketplaceItems>>) {
  const sorted = [...items];

  if (sort === "price_asc") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (sort === "price_desc") {
    sorted.sort((a, b) => b.price - a.price);
  } else if (sort === "rating_desc") {
    sorted.sort((a, b) => b.seller.rating - a.seller.rating);
  } else if (sort === "saved_desc") {
    sorted.sort((a, b) => b.savesCount - a.savesCount);
  } else {
    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return sorted;
}

export async function GET(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for marketplace.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get("page"), 1, 500);
    const limit = parsePositiveInt(searchParams.get("limit"), 24, 60);
    const mine = searchParams.get("mine") === "true";
    const category = searchParams.get("category");
    const condition = searchParams.get("condition");
    const priceMin = parseNumber(searchParams.get("price_min"));
    const priceMax = parseNumber(searchParams.get("price_max"));
    const shipping = searchParams.get("shipping");
    const search = searchParams.get("search")?.trim();
    const ratingMin = parseNumber(searchParams.get("rating_min"));
    const sortParam = searchParams.get("sort");
    const sort: MarketplaceSort = isMarketplaceSort(sortParam) ? sortParam : "newest";

    let query = supabase
      .from("marketplace_items")
      .select(marketplaceItemSelect)
      .eq("university_id", universityId);

    if (mine) {
      query = query.eq("user_id", userId);
    } else {
      query = query.eq("is_available", true).eq("status", "active");
    }

    if (category && isMarketplaceCategory(category)) {
      query = query.eq("category", category);
    }

    if (condition) {
      const conditions = condition
        .split(",")
        .map((item) => item.trim())
        .filter(isMarketplaceCondition);

      if (conditions.length) {
        query = query.in("condition", conditions);
      }
    }

    if (priceMin !== null) {
      query = query.gte("price", priceMin);
    }

    if (priceMax !== null) {
      query = query.lte("price", priceMax);
    }

    if (shipping === "shipping") {
      query = query.eq("shipping_available", true);
    } else if (shipping === "pickup") {
      query = query.eq("local_pickup", true);
    }

    if (search) {
      const safeSearch = search.replace(/[%,]/g, " ").trim();
      if (safeSearch) {
        query = query.or(`title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,category.ilike.%${safeSearch}%`);
      }
    }

    const result = await query.order("created_at", { ascending: false }).limit(500);

    if (result.error) {
      return fail(result.error.message, 500);
    }

    let items = await hydrateMarketplaceItems(supabase, (result.data ?? []) as MarketplaceItemRow[], userId);

    if (ratingMin !== null) {
      items = items.filter((item) => item.seller.rating >= ratingMin);
    }

    items = sortItems(sort, items);
    const from = (page - 1) * limit;
    const pageItems = items.slice(from, from + limit);

    return ok({
      items: pageItems,
      hasMore: items.length > from + pageItems.length,
      total: items.length
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load marketplace",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for marketplace.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const category = String(body.category ?? "").trim();
    const condition = String(body.condition ?? "").trim();
    const price = Number(body.price);
    const imageUrls = normalizeStringArray(body.image_urls);
    const status = String(body.status ?? "active").trim() === "draft" ? "draft" : "active";
    const contactPreference = String(body.contact_preference ?? "direct_message").trim();
    const contactPhone = String(body.contact_phone ?? "").trim() || null;
    const itemId = typeof body.id === "string" && isUuid(body.id) ? body.id : undefined;

    if (!title || title.length > 100) {
      return fail("Add an item title under 100 characters.");
    }

    if (!description || description.length > 500) {
      return fail("Add a description under 500 characters.");
    }

    if (!isMarketplaceCategory(category)) {
      return fail("Choose a valid category.");
    }

    if (!isMarketplaceCondition(condition)) {
      return fail("Choose a valid condition.");
    }

    if (!Number.isFinite(price) || price <= 0) {
      return fail("Add a valid price.");
    }

    if (!imageUrls.length || imageUrls.length > 5) {
      return fail("Upload between one and five images.");
    }

    const insertQuery = await supabase
      .from("marketplace_items")
      .insert({
        ...(itemId ? { id: itemId } : {}),
        user_id: userId,
        university_id: universityId,
        title,
        description,
        category,
        condition,
        price,
        image_urls: imageUrls,
        is_available: status === "active",
        status,
        shipping_available: Boolean(body.shipping_available),
        local_pickup: body.local_pickup === undefined ? true : Boolean(body.local_pickup),
        contact_preference: contactPreference === "phone_call" ? "phone_call" : "direct_message",
        contact_phone: contactPhone,
        allows_negotiation: Boolean(body.allows_negotiation),
        specifications: normalizeSpecifications(body.specifications)
      })
      .select(marketplaceItemSelect)
      .single();

    if (insertQuery.error) {
      return fail(insertQuery.error.message, 500);
    }

    const [item] = await hydrateMarketplaceItems(supabase, [insertQuery.data as MarketplaceItemRow], userId);
    return ok(item, { status: 201 });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to create marketplace item",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
