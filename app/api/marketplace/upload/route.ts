import { fail, ok, requireUserId } from "@/lib/http";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { uploadPublicImage } from "@/lib/storage";

export const dynamic = "force-dynamic";

function isUuid(value: string | null | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value));
}

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for marketplace images.", 500);
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);
    const itemIdFromForm = formData.get("itemId");
    const itemId = typeof itemIdFromForm === "string" && isUuid(itemIdFromForm) ? itemIdFromForm : crypto.randomUUID();

    if (!files.length) {
      return fail("Choose at least one item image.");
    }

    if (files.length > 5) {
      return fail("Upload at most five images.");
    }

    const uploads = [];

    for (const [index, file] of files.entries()) {
      uploads.push(
        await uploadPublicImage({
          supabase,
          bucketName: "marketplace",
          userId,
          file,
          suffix: String(index + 1),
          pathPrefix: `${userId}/${itemId}`
        })
      );
    }

    return ok({
      itemId,
      uploads,
      urls: uploads.map((upload) => upload.url)
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to upload marketplace images",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
