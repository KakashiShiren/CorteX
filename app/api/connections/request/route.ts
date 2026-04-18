import { requestConnection } from "@/lib/repository";
import { fail, ok, requireUserId } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const body = await request.json();
    const connection = requestConnection(userId, body.toUserId);
    return ok({ success: true, connectionId: connection.id, connection });
  } catch (error) {
    return fail(error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : error instanceof Error ? error.message : "Unable to send request", error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400);
  }
}
