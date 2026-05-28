import { fail, ok, requireUserId } from "@/lib/http";
import {
  canvasAssignmentSelect,
  canvasIntegrationSelect,
  getActiveCanvasIntegration,
  mapCanvasAssignment,
  type CanvasAssignmentRow,
  type CanvasIntegrationRow
} from "@/lib/canvas";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for Canvas.", 500);
    }

    const integration = await getActiveCanvasIntegration(supabase, userId);

    if (!integration) {
      return ok({
        connected: false,
        courses: [],
        assignmentsCount: 0
      });
    }

    const assignmentsQuery = await supabase
      .from("canvas_assignments")
      .select(canvasAssignmentSelect)
      .eq("user_id", userId)
      .order("due_date", { ascending: true, nullsFirst: false });

    if (assignmentsQuery.error) {
      return fail(assignmentsQuery.error.message, 500);
    }

    const assignments = ((assignmentsQuery.data ?? []) as CanvasAssignmentRow[]).map(mapCanvasAssignment);
    const courseMap = new Map<string, { id: string; name: string; assignmentsCount: number }>();

    for (const assignment of assignments) {
      const existing = courseMap.get(assignment.canvasCourseId);
      courseMap.set(assignment.canvasCourseId, {
        id: assignment.canvasCourseId,
        name: assignment.courseName,
        assignmentsCount: (existing?.assignmentsCount ?? 0) + 1
      });
    }

    return ok({
      connected: true,
      integration: {
        id: integration.id,
        canvasUserId: integration.canvas_user_id,
        canvasBaseUrl: integration.canvas_base_url,
        lastSyncedAt: integration.last_synced_at,
        tokenExpiresAt: integration.token_expires_at,
        createdAt: integration.created_at,
        updatedAt: integration.updated_at
      },
      courses: Array.from(courseMap.values()),
      assignmentsCount: assignments.length
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load Canvas integration",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function DELETE() {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for Canvas.", 500);
    }

    const integrationQuery = await supabase
      .from("canvas_integrations")
      .select(canvasIntegrationSelect)
      .eq("user_id", userId)
      .maybeSingle();

    if (integrationQuery.error && integrationQuery.error.code !== "PGRST116") {
      return fail(integrationQuery.error.message, 500);
    }

    const integration = integrationQuery.data as CanvasIntegrationRow | null;

    if (integration) {
      const updateQuery = await supabase
        .from("canvas_integrations")
        .update({
          canvas_access_token: null,
          canvas_refresh_token: null,
          token_expires_at: null,
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq("id", integration.id);

      if (updateQuery.error) {
        return fail(updateQuery.error.message, 500);
      }
    }

    const deleteAssignments = await supabase
      .from("canvas_assignments")
      .delete()
      .eq("user_id", userId);

    if (deleteAssignments.error) {
      return fail(deleteAssignments.error.message, 500);
    }

    return ok({ connected: false });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to disconnect Canvas",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
