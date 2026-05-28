import { fail, ok, requireUserId } from "@/lib/http";
import { getCurrentUserUniversityId } from "@/lib/housing";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for housing inquiries.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const postQuery = await supabase
      .from("housing_posts")
      .select("id, user_id")
      .eq("id", params.id)
      .eq("university_id", universityId)
      .eq("status", "active")
      .maybeSingle();

    if (postQuery.error) {
      return fail(postQuery.error.message, 500);
    }

    if (!postQuery.data) {
      return fail("Housing listing not found.", 404);
    }

    if (postQuery.data.user_id === userId) {
      return fail("You cannot inquire about your own listing.");
    }

    const body = (await request.json().catch(() => ({}))) as Partial<{ message: string }>;
    const message = body.message?.trim() || "I am interested in this listing.";

    if (message.length > 500) {
      return fail("Inquiry messages can be at most 500 characters.");
    }

    const insertQuery = await supabase
      .from("housing_inquiries")
      .insert({
        housing_post_id: params.id,
        student_id: userId,
        message
      })
      .select("id")
      .single();

    if (insertQuery.error) {
      return fail(insertQuery.error.message, 500);
    }

    return ok(
      {
        success: true,
        inquiryId: insertQuery.data.id
      },
      { status: 201 }
    );
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to send inquiry",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
