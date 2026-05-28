import { fail, ok, requireUserId } from "@/lib/http";
import { getCurrentUserUniversityId } from "@/lib/posts";
import type { FeedPostRsvpStatus } from "@/lib/types";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type PostCountRow = {
  id: string;
  university_id: string | null;
  rsvp_going_count: number | null;
};

type ExistingRsvpRow = {
  id: string;
  status: FeedPostRsvpStatus | null;
};

async function getScopedRsvpContext(postId: string, userId: string) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for posts.");
  }

  const universityId = await getCurrentUserUniversityId(supabase, userId);
  if (!universityId) {
    throw new Error("Your campus workspace is still being prepared.");
  }

  const postQuery = await supabase
    .from("posts")
    .select("id, university_id, rsvp_going_count")
    .eq("id", postId)
    .eq("university_id", universityId)
    .maybeSingle();

  if (postQuery.error) {
    throw new Error(postQuery.error.message);
  }

  return {
    supabase,
    post: (postQuery.data as PostCountRow | null) ?? null
  };
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, post } = await getScopedRsvpContext(params.id, userId);

    if (!post) {
      return fail("Post not found.", 404);
    }

    const body = (await request.json().catch(() => ({}))) as Partial<{ status: FeedPostRsvpStatus }>;
    if (body.status !== "going" && body.status !== "not_interested") {
      return fail("Choose a valid RSVP status.");
    }

    const existingQuery = await supabase
      .from("post_rsvps")
      .select("id, status")
      .eq("post_id", params.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingQuery.error) {
      return fail(existingQuery.error.message, 500);
    }

    const existing = (existingQuery.data as ExistingRsvpRow | null) ?? null;
    const previousStatus = existing?.status ?? null;
    const nextStatus = body.status;
    const delta = previousStatus === nextStatus ? 0 : previousStatus === "going" ? -1 : nextStatus === "going" ? 1 : 0;

    const upsertQuery = await supabase.from("post_rsvps").upsert(
      {
        post_id: params.id,
        user_id: userId,
        status: nextStatus
      },
      {
        onConflict: "post_id,user_id"
      }
    );

    if (upsertQuery.error) {
      return fail(upsertQuery.error.message, 500);
    }

    const newCount = Math.max(0, (post.rsvp_going_count ?? 0) + delta);
    const updateQuery = await supabase
      .from("posts")
      .update({
        rsvp_going_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id);

    if (updateQuery.error) {
      return fail(updateQuery.error.message, 500);
    }

    return ok({
      success: true,
      newCount
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to update RSVP",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, post } = await getScopedRsvpContext(params.id, userId);

    if (!post) {
      return fail("Post not found.", 404);
    }

    const existingQuery = await supabase
      .from("post_rsvps")
      .select("id, status")
      .eq("post_id", params.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingQuery.error) {
      return fail(existingQuery.error.message, 500);
    }

    const existing = (existingQuery.data as ExistingRsvpRow | null) ?? null;
    if (existing?.id) {
      const deleteQuery = await supabase.from("post_rsvps").delete().eq("id", existing.id);

      if (deleteQuery.error) {
        return fail(deleteQuery.error.message, 500);
      }
    }

    const delta = existing?.status === "going" ? -1 : 0;
    const newCount = Math.max(0, (post.rsvp_going_count ?? 0) + delta);
    const updateQuery = await supabase
      .from("posts")
      .update({
        rsvp_going_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id);

    if (updateQuery.error) {
      return fail(updateQuery.error.message, 500);
    }

    return ok({
      success: true,
      newCount
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to remove RSVP",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
