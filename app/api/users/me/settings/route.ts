import { updateUserSettings } from "@/lib/repository";
import { fail, ok, requireUserId } from "@/lib/http";

export async function PUT(request: Request) {
  try {
    const userId = requireUserId();
    const body = await request.json();
    return ok(updateUserSettings(userId, body));
  } catch (error) {
    return fail(error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : error instanceof Error ? error.message : "Unable to update settings", error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400);
  }
}
