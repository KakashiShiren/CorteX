import { fail, ok, requireUserId } from "@/lib/http";
import { respondToConnection } from "@/lib/repository";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    return ok({ success: true, connection: respondToConnection(userId, params.id, "rejected") });
  } catch (error) {
    return fail(error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : error instanceof Error ? error.message : "Unable to reject request", error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400);
  }
}
