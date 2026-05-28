import { fail, ok, requireUserId } from "@/lib/http";
import { getCurrentUserUniversityId } from "@/lib/marketplace";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getScopedItem(itemId: string, userId: string) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for marketplace saves.");
  }

  const universityId = await getCurrentUserUniversityId(supabase, userId);
  if (!universityId) {
    throw new Error("Your campus workspace is still being prepared.");
  }

  const itemQuery = await supabase
    .from("marketplace_items")
    .select("id, saves_count")
    .eq("id", itemId)
    .eq("university_id", universityId)
    .maybeSingle();

  if (itemQuery.error) {
    throw new Error(itemQuery.error.message);
  }

  return {
    supabase,
    item: itemQuery.data as { id: string; saves_count: number | null } | null
  };
}

export async function POST(_request: Request, { params }: { params: { itemId: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, item } = await getScopedItem(params.itemId, userId);

    if (!item) {
      return fail("Marketplace item not found.", 404);
    }

    const insertQuery = await supabase
      .from("marketplace_saves")
      .upsert({
        user_id: userId,
        item_id: params.itemId
      }, {
        onConflict: "user_id,item_id"
      });

    if (insertQuery.error) {
      return fail(insertQuery.error.message, 500);
    }

    const countQuery = await supabase
      .from("marketplace_saves")
      .select("id", { count: "exact", head: true })
      .eq("item_id", params.itemId);

    const nextCount = countQuery.count ?? item.saves_count ?? 0;
    await supabase.from("marketplace_items").update({ saves_count: nextCount }).eq("id", params.itemId);

    return ok({ saved: true, savesCount: nextCount });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to save marketplace item",
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

    const deleteQuery = await supabase
      .from("marketplace_saves")
      .delete()
      .eq("user_id", userId)
      .eq("item_id", params.itemId);

    if (deleteQuery.error) {
      return fail(deleteQuery.error.message, 500);
    }

    const countQuery = await supabase
      .from("marketplace_saves")
      .select("id", { count: "exact", head: true })
      .eq("item_id", params.itemId);

    const nextCount = countQuery.count ?? 0;
    await supabase.from("marketplace_items").update({ saves_count: nextCount }).eq("id", params.itemId);

    return ok({ saved: false, savesCount: nextCount });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to unsave marketplace item",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
