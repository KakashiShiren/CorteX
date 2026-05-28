import { fail, ok, requireUserId } from "@/lib/http";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { uploadPublicImage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for housing image uploads.", 500);
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);

    if (!files.length) {
      const singleFile = formData.get("file");

      if (!(singleFile instanceof File)) {
        return fail("Choose at least one image to upload.");
      }

      files.push(singleFile);
    }

    if (files.length > 5) {
      return fail("Upload at most five images.");
    }

    const uploads = [];

    for (const [index, file] of files.entries()) {
      uploads.push(
        await uploadPublicImage({
          supabase,
          bucketName: "housing",
          userId,
          file,
          suffix: String(index + 1)
        })
      );
    }

    return ok({
      uploads,
      urls: uploads.map((upload) => upload.url)
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to upload housing images",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
