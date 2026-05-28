import { fail, ok, requireUserId } from "@/lib/http";
import {
  getCurrentUserUniversityId,
  hydrateMarketplaceItemDetail,
  hydrateMarketplaceItems,
  isMarketplaceCategory,
  isMarketplaceCondition,
  marketplaceItemSelect,
  normalizeSpecifications,
  type MarketplaceItemRow
} from "@/lib/marketplace";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getScopedItem(itemId: string, userId: string) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for marketplace.");
  }

  const universityId = await getCurrentUserUniversityId(supabase, userId);
  if (!universityId) {
    throw new Error("Your campus workspace is still being prepared.");
  }

  const itemQuery = await supabase
    .from("marketplace_items")
    .select(marketplaceItemSelect)
    .eq("id", itemId)
    .eq("university_id", universityId)
    .maybeSingle();

  if (itemQuery.error) {
    throw new Error(itemQuery.error.message);
  }

  return {
    supabase,
    item: (itemQuery.data as MarketplaceItemRow | null) ?? null
  };
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 5);
}

export async function GET(_request: Request, { params }: { params: { itemId: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, item } = await getScopedItem(params.itemId, userId);

    if (!item) {
      return fail("Marketplace item not found.", 404);
    }

    if (item.user_id !== userId) {
      await supabase
        .from("marketplace_items")
        .update({
          views_count: (item.views_count ?? 0) + 1
        })
        .eq("id", item.id);
    }

    const detail = await hydrateMarketplaceItemDetail(supabase, item, userId);
    return ok(detail);
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load marketplace item",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function PUT(request: Request, { params }: { params: { itemId: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, item } = await getScopedItem(params.itemId, userId);

    if (!item) {
      return fail("Marketplace item not found.", 404);
    }

    if (item.user_id !== userId) {
      return fail("You can only update your own marketplace items.", 403);
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if ("title" in body) {
      const title = String(body.title ?? "").trim();
      if (!title || title.length > 100) {
        return fail("Add an item title under 100 characters.");
      }
      payload.title = title;
    }

    if ("description" in body) {
      const description = String(body.description ?? "").trim();
      if (!description || description.length > 500) {
        return fail("Add a description under 500 characters.");
      }
      payload.description = description;
    }

    if ("category" in body) {
      const category = String(body.category ?? "").trim();
      if (!isMarketplaceCategory(category)) {
        return fail("Choose a valid category.");
      }
      payload.category = category;
    }

    if ("condition" in body) {
      const condition = String(body.condition ?? "").trim();
      if (!isMarketplaceCondition(condition)) {
        return fail("Choose a valid condition.");
      }
      payload.condition = condition;
    }

    if ("price" in body) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) {
        return fail("Add a valid price.");
      }
      payload.price = price;
    }

    if ("image_urls" in body) {
      const imageUrls = normalizeStringArray(body.image_urls) ?? [];
      if (imageUrls.length > 5) {
        return fail("Upload at most five images.");
      }
      payload.image_urls = imageUrls;
    }

    if ("shipping_available" in body) {
      payload.shipping_available = Boolean(body.shipping_available);
    }

    if ("local_pickup" in body) {
      payload.local_pickup = Boolean(body.local_pickup);
    }

    if ("allows_negotiation" in body) {
      payload.allows_negotiation = Boolean(body.allows_negotiation);
    }

    if ("specifications" in body) {
      payload.specifications = normalizeSpecifications(body.specifications);
    }

    if ("status" in body) {
      const status = String(body.status ?? "").trim();
      if (!["active", "draft", "sold", "deleted"].includes(status)) {
        return fail("Choose a valid status.");
      }
      payload.status = status;
      payload.is_available = status === "active";
    }

    if ("is_available" in body && !("status" in body)) {
      payload.is_available = Boolean(body.is_available);
      payload.status = Boolean(body.is_available) ? "active" : "sold";
    }

    const updateQuery = await supabase
      .from("marketplace_items")
      .update(payload)
      .eq("id", params.itemId)
      .select(marketplaceItemSelect)
      .single();

    if (updateQuery.error) {
      return fail(updateQuery.error.message, 500);
    }

    const [updated] = await hydrateMarketplaceItems(supabase, [updateQuery.data as MarketplaceItemRow], userId);
    return ok(updated);
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to update marketplace item",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { itemId: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, item } = await getScopedItem(params.itemId, userId);

    if (!item) {
      return fail("Marketplace item not found.", 404);
    }

    if (item.user_id !== userId) {
      return fail("You can only delete your own marketplace items.", 403);
    }

    const ordersQuery = await supabase
      .from("marketplace_orders")
      .select("id")
      .eq("item_id", params.itemId)
      .limit(1);

    if (ordersQuery.error) {
      return fail(ordersQuery.error.message, 500);
    }

    if ((ordersQuery.data ?? []).length) {
      const archiveQuery = await supabase
        .from("marketplace_items")
        .update({
          status: "deleted",
          is_available: false,
          updated_at: new Date().toISOString()
        })
        .eq("id", params.itemId);

      if (archiveQuery.error) {
        return fail(archiveQuery.error.message, 500);
      }

      return ok({ success: true, archived: true });
    }

    const deleteQuery = await supabase.from("marketplace_items").delete().eq("id", params.itemId);

    if (deleteQuery.error) {
      return fail(deleteQuery.error.message, 500);
    }

    return ok({ success: true, archived: false });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to delete marketplace item",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
