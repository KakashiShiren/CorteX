import { blockUser } from "@/lib/repository";
import { fail, ok, requireUserId } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const body = await request.json();
    return ok(blockUser(userId, body.userId));
  } catch (error) {
    return fail(error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : error instanceof Error ? error.message : "Unable to block user", error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400);
  }
}
