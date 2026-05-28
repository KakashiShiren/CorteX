import { fail, ok, requireUserId } from "@/lib/http";
import { getCurrentUser, getStudentById } from "@/lib/repository";
import { applyStudentConnection, findResolvedConnection } from "@/lib/supabase/connections";
import { mapStudentRow, StudentRow } from "@/lib/supabase/mappers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getCurrentUserUniversityId } from "@/lib/university";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    if (getCurrentUser(userId)) {
      const student = getStudentById(params.id, userId);
      return student ? ok(student) : fail("Student not found", 404);
    }

    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for student profiles.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const studentQuery = await supabase
      .from("students")
      .select(
        "id, user_id, email, name, university_id, major, year, residence, bio, profile_picture_url, interests, is_verified, is_online, current_status, created_at, updated_at"
      )
      .eq("user_id", params.id)
      .eq("university_id", universityId)
      .eq("is_verified", true)
      .single();

    if (studentQuery.error) {
      return fail("Student not found", 404);
    }

    const connection = await findResolvedConnection(supabase, userId, params.id);
    return ok(applyStudentConnection(mapStudentRow(studentQuery.data as StudentRow), userId, connection));
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Unable to load student",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
