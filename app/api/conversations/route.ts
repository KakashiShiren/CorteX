import { getOrCreateConversation, listConversations } from "@/lib/repository";
import { fail, ok, requireUserId } from "@/lib/http";

export async function GET() {
  try {
    const userId = requireUserId();
    const conversations = listConversations(userId);
    return ok({ conversations, total: conversations.length });
  } catch (error) {
    return fail(error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Unable to load conversations", error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400);
  }
}

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const body = await request.json();
    return ok(getOrCreateConversation(userId, body.peerId));
  } catch (error) {
    return fail(error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : error instanceof Error ? error.message : "Unable to create conversation", error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400);
  }
}
