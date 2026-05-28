import { fail, ok, requireUserId } from "@/lib/http";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { uploadPublicImage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for profile image uploads.", 500);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail("Choose a profile image to upload.");
    }

    const upload = await uploadPublicImage({
      supabase,
      bucketName: "avatars",
      userId,
      file,
      suffix: "profile"
    });

    return ok(upload);
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to upload profile image",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
