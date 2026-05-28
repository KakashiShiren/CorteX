import { fail, ok, requireUserId } from "@/lib/http";
import { getCurrentUser } from "@/lib/repository";
import { findResolvedConnection, mapStudentConnectionState } from "@/lib/supabase/connections";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const userId = requireUserId();
    const peerId = new URL(request.url).searchParams.get("peerId")?.trim();

    if (!peerId) {
      return fail("Choose a student to inspect.");
    }

    if (getCurrentUser(userId)) {
      return ok({
        connectionStatus: "none" as const
      });
    }

    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for connections.", 500);
    }

    const connection = await findResolvedConnection(supabase, userId, peerId);
    return ok(mapStudentConnectionState(userId, connection));
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load connection status",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
