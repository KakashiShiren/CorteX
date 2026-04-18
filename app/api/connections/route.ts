import { getConnectionsForUser } from "@/lib/repository";
import { fail, ok, requireUserId } from "@/lib/http";

export async function GET() {
  try {
    const userId = requireUserId();
    return ok({ connections: getConnectionsForUser(userId) });
  } catch (error) {
    return fail(error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Unable to load connections", error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400);
  }
}
