import { markMessageRead } from "@/lib/repository";
import { fail, ok, requireUserId } from "@/lib/http";

export async function PUT(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    return ok({ success: true, message: markMessageRead(params.id, userId) });
  } catch (error) {
    return fail(error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : error instanceof Error ? error.message : "Unable to mark message as read", error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400);
  }
}
