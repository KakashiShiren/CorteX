import { fail, ok, requireUserId } from "@/lib/http";
import { searchHousingListings } from "@/lib/housing-search";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for housing search.", 500);
    }

    const { searchParams } = new URL(request.url);
    const result = await searchHousingListings({ supabase, userId, searchParams });
    return ok(result);
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to search housing",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
