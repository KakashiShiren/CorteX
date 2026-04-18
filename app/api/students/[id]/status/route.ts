import { fail, ok, requireUserId } from "@/lib/http";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { normalizeCurrentStatus } from "@/lib/supabase/mappers";

type StudentStatusRow = {
  current_status: unknown;
};

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    requireUserId();

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return fail("Supabase is not configured for status lookups.", 500);
    }

    const query = await supabase
      .from("students")
      .select("current_status")
      .eq("user_id", params.id)
      .maybeSingle();

    if (query.error) {
      return fail("Unable to load status", 500);
    }

    return ok(normalizeCurrentStatus((query.data as StudentStatusRow | null)?.current_status) ?? null);
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Unable to load status",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
