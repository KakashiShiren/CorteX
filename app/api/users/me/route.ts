import { fail, ok, requireUserId } from "@/lib/http";
import { mapUserRow, normalizeCurrentStatus, UserRow } from "@/lib/supabase/mappers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type StudentStatusRow = {
  current_status: unknown;
};

type ConnectionCountRow = {
  id: string;
};

export async function GET() {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for user sessions.", 500);
    }

    const userQuery = await supabase
      .from("users")
      .select(
        "id, email, name, major, year, residence, bio, profile_picture_url, interests, is_verified, is_online, searchable, show_major, show_year, show_residence, show_interests, show_online_status, message_permission, blocked_users, created_at, updated_at"
      )
      .eq("id", userId)
      .single();

    if (userQuery.error) {
      return fail("Session expired. Please sign in again.", 401);
    }

    const statusQuery = await supabase
      .from("students")
      .select("current_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (statusQuery.error) {
      return fail("Unable to load current status", 500);
    }

    const connectionsQuery = await supabase
      .from("connections")
      .select("id")
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .eq("status", "accepted");

    if (connectionsQuery.error) {
      return fail("Unable to load connection count", 500);
    }

    return ok({
      ...mapUserRow(userQuery.data as UserRow),
      status: normalizeCurrentStatus((statusQuery.data as StudentStatusRow | null)?.current_status),
      connectionsCount: ((connectionsQuery.data ?? []) as ConnectionCountRow[]).length
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Unable to load user",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for profile updates.", 500);
    }

    const body = (await request.json()) as Partial<{
      name: string;
      major: string;
      year: string;
      residence: string;
      bio: string;
      interests: string[];
    }>;

    const payload = {
      name: body.name,
      major: body.major,
      year: body.year,
      residence: body.residence,
      bio: body.bio,
      interests: body.interests
    };

    const userUpdate = await supabase
      .from("users")
      .update(payload)
      .eq("id", userId)
      .select(
        "id, email, name, major, year, residence, bio, profile_picture_url, interests, is_verified, is_online, searchable, show_major, show_year, show_residence, show_interests, show_online_status, message_permission, blocked_users, created_at, updated_at"
      )
      .single();

    if (userUpdate.error) {
      return fail(userUpdate.error.message, 500);
    }

    const studentUpdate = await supabase
      .from("students")
      .update(payload)
      .eq("user_id", userId);

    if (studentUpdate.error) {
      return fail(studentUpdate.error.message, 500);
    }

    return ok(mapUserRow(userUpdate.data as UserRow));
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to update user",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
