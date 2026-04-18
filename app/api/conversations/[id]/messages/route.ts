import { listMessages, sendMessage } from "@/lib/repository";
import { fail, ok, requireUserId } from "@/lib/http";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const messages = listMessages(params.id, userId);
    return ok({ messages, total: messages.length });
  } catch (error) {
    return fail(error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : error instanceof Error ? error.message : "Unable to load messages", error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400);
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const body = await request.json();
    return ok({ success: true, message: sendMessage(params.id, userId, body.content) });
  } catch (error) {
    return fail(error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : error instanceof Error ? error.message : "Unable to send message", error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400);
  }
}
