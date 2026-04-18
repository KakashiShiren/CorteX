import { activityOptions } from "@/lib/constants";
import { env } from "@/lib/env";
import { fail, ok, requireUserId } from "@/lib/http";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { mapStatusRow } from "@/lib/supabase/mappers";
import { statusSchema } from "@/lib/validators";

type StatusRow = Parameters<typeof mapStatusRow>[0];

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const body = await request.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid status");
    }

    const match = activityOptions.find((option) => option.value === parsed.data.activity);
    if (!match) {
      return fail("Unknown activity");
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      console.error("[status] Missing Supabase service configuration.", {
        hasUrl: Boolean(env.supabaseUrl),
        hasServiceKey: Boolean(env.supabaseServiceKey)
      });
      return fail("Supabase is not configured for status updates.", 500);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + parsed.data.durationMinutes * 60 * 1000).toISOString();
    const statusQuery = await supabase
      .from("user_status")
      .upsert(
        {
          user_id: userId,
          activity: match.value,
          emoji: match.emoji,
          location: parsed.data.location || null,
          custom_text: parsed.data.customText || null,
          is_visible: true,
          created_at: now.toISOString(),
          expires_at: expiresAt
        },
        { onConflict: "user_id" }
      )
      .select("id, user_id, activity, emoji, location, custom_text, is_visible, created_at, expires_at")
      .single();

    if (statusQuery.error) {
      console.error("[status] Failed to upsert user_status.", statusQuery.error);
      return fail("Unable to save status to Supabase.", 500);
    }

    const status = {
      ...mapStatusRow(statusQuery.data as StatusRow),
      durationMinutes: parsed.data.durationMinutes
    };
    const mirrorQuery = await supabase
      .from("students")
      .update({
        current_status: status
      })
      .eq("user_id", userId)
      .select("user_id")
      .single();

    if (mirrorQuery.error) {
      console.error("[status] Failed to mirror current_status into students.", mirrorQuery.error);
      return fail("Status saved, but student profile sync failed.", 500);
    }

    return ok({
      success: true,
      status
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to update status",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function DELETE() {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      console.error("[status] Missing Supabase service configuration for delete.", {
        hasUrl: Boolean(env.supabaseUrl),
        hasServiceKey: Boolean(env.supabaseServiceKey)
      });
      return fail("Supabase is not configured for status updates.", 500);
    }

    const deleteQuery = await supabase.from("user_status").delete().eq("user_id", userId);
    if (deleteQuery.error) {
      console.error("[status] Failed to delete user_status.", deleteQuery.error);
      return fail("Unable to clear status from Supabase.", 500);
    }

    const mirrorQuery = await supabase
      .from("students")
      .update({
        current_status: null
      })
      .eq("user_id", userId)
      .select("user_id")
      .single();

    if (mirrorQuery.error) {
      console.error("[status] Failed to clear current_status on students.", mirrorQuery.error);
      return fail("Status cleared, but student profile sync failed.", 500);
    }

    return ok({ success: true });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to clear status",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
