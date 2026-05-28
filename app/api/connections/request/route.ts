import { fail, ok, requireUserId } from "@/lib/http";
import {
  connectionSelect,
  findConnectionsBetween,
  resolveConnectionRow
} from "@/lib/supabase/connections";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getCurrentUserUniversityId } from "@/lib/university";

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const body = (await request.json()) as Partial<{ toUserId: string }>;
    const toUserId = body.toUserId?.trim();

    if (!toUserId) {
      return fail("Choose a student to connect with.");
    }

    if (toUserId === userId) {
      return fail("You cannot connect with yourself.");
    }

    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for connections.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const peerQuery = await supabase
      .from("students")
      .select("user_id")
      .eq("user_id", toUserId)
      .eq("university_id", universityId)
      .eq("is_verified", true)
      .maybeSingle();

    if (peerQuery.error) {
      return fail(peerQuery.error.message, 500);
    }

    if (!peerQuery.data) {
      return fail("That student is not available for connections.", 404);
    }

    const existingRows = await findConnectionsBetween(supabase, userId, toUserId);
    const resolved = resolveConnectionRow(existingRows);
    const now = new Date().toISOString();

    if (resolved?.status === "accepted") {
      return ok({
        success: true,
        connectionId: resolved.id,
        alreadyConnected: true
      });
    }

    if (resolved?.status === "pending") {
      if (resolved.from_user_id === userId) {
        return ok({
          success: true,
          connectionId: resolved.id,
          alreadyPending: true
        });
      }

      return fail(
        "This student already sent you a request. Open your requests page to respond.",
        409,
        {
          connectionId: resolved.id,
          connectionStatus: "incoming_pending"
        }
      );
    }

    const mutation = resolved
      ? await supabase
          .from("connections")
          .update({
            from_user_id: userId,
            to_user_id: toUserId,
            status: "pending",
            created_at: now,
            responded_at: null
          })
          .eq("id", resolved.id)
          .select(connectionSelect)
          .single()
      : await supabase
          .from("connections")
          .insert({
            from_user_id: userId,
            to_user_id: toUserId,
            status: "pending"
          })
          .select(connectionSelect)
          .single();

    if (mutation.error || !mutation.data) {
      return fail(mutation.error?.message ?? "Unable to send connection request", 500);
    }

    return ok({
      success: true,
      connectionId: mutation.data.id,
      connection: mutation.data
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to send request",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
