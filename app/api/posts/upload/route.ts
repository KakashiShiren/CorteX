import { fail, ok, requireUserId } from "@/lib/http";
import { uploadImage } from "@/lib/storage";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for image uploads.", 500);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail("Choose an image to upload.");
    }

    const upload = await uploadImage({
      supabase,
      bucketName: "posts",
      userId,
      file
    });

    return ok({
      url: upload.url,
      path: upload.path
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to upload image",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
