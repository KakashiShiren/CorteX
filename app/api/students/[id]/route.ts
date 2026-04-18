import { fail, ok, requireUserId } from "@/lib/http";
import { mapStudentRow, StudentRow } from "@/lib/supabase/mappers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { Student } from "@/lib/types";

type ConnectionRow = {
  from_user_id: string;
  to_user_id: string;
  status: "pending" | "accepted" | "rejected";
};

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for student profiles.", 500);
    }

    const studentQuery = await supabase
      .from("students")
      .select(
        "id, user_id, email, name, major, year, residence, bio, profile_picture_url, interests, is_verified, is_online, current_status, created_at, updated_at"
      )
      .eq("user_id", params.id)
      .eq("is_verified", true)
      .single();

    if (studentQuery.error) {
      return fail("Student not found", 404);
    }

    const connectionsQuery = await supabase
      .from("connections")
      .select("from_user_id, to_user_id, status")
      .or(
        `and(from_user_id.eq.${userId},to_user_id.eq.${params.id}),and(from_user_id.eq.${params.id},to_user_id.eq.${userId})`
      )
      .maybeSingle();

    if (connectionsQuery.error) {
      return fail("Unable to load student connection state", 500);
    }

    const connectionStatus =
      (connectionsQuery.data as ConnectionRow | null)?.status === "accepted"
        ? "message"
        : ((connectionsQuery.data as ConnectionRow | null)?.status as Student["connectionStatus"] | undefined);

    return ok(mapStudentRow(studentQuery.data as StudentRow, connectionStatus));
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Unable to load student",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
