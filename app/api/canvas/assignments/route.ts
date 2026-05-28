import { fail, ok, requireUserId } from "@/lib/http";
import {
  canvasAssignmentSelect,
  mapCanvasAssignment,
  type CanvasAssignmentRow
} from "@/lib/canvas";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value ?? fallback);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

export async function GET(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for Canvas assignments.", 500);
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("course_id")?.trim();
    const submitted = searchParams.get("submitted");
    const upcomingOnly = searchParams.get("upcoming") !== "false";
    const limit = parsePositiveInt(searchParams.get("limit"), 100, 300);

    let query = supabase
      .from("canvas_assignments")
      .select(canvasAssignmentSelect)
      .eq("user_id", userId);

    if (courseId && courseId !== "all") {
      query = query.eq("canvas_course_id", courseId);
    }

    if (submitted === "true") {
      query = query.eq("submitted", true);
    } else if (submitted === "false") {
      query = query.eq("submitted", false);
    }

    if (upcomingOnly) {
      query = query.gte("due_date", new Date().toISOString());
    }

    const result = await query.order("due_date", { ascending: true, nullsFirst: false }).limit(limit);

    if (result.error) {
      return fail(result.error.message, 500);
    }

    const assignments = ((result.data ?? []) as CanvasAssignmentRow[]).map(mapCanvasAssignment);
    return ok({
      assignments,
      total: assignments.length
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load Canvas assignments",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for Canvas assignments.", 500);
    }

    const body = (await request.json().catch(() => ({}))) as Partial<{
      assignmentId: string;
      locallyDone: boolean;
    }>;
    const assignmentId = body.assignmentId?.trim();

    if (!assignmentId) {
      return fail("Choose an assignment.");
    }

    const updateQuery = await supabase
      .from("canvas_assignments")
      .update({
        locally_done: Boolean(body.locallyDone),
        updated_at: new Date().toISOString()
      })
      .eq("id", assignmentId)
      .eq("user_id", userId)
      .select(canvasAssignmentSelect)
      .single();

    if (updateQuery.error) {
      return fail(updateQuery.error.message, 500);
    }

    return ok(mapCanvasAssignment(updateQuery.data as CanvasAssignmentRow));
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to update Canvas assignment",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
