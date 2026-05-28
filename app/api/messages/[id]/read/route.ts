import { fail, ok, requireUserId } from "@/lib/http";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function PUT(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for messages.", 500);
    }

    const update = await supabase
      .from("messages")
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .eq("receiver_id", userId)
      .select("id, conversation_id, sender_id, receiver_id, content, is_read, read_at, created_at")
      .maybeSingle();

    if (update.error) {
      return fail(update.error.message, 500);
    }

    if (!update.data) {
      return fail("Message not found.", 404);
    }

    return ok({
      success: true,
      message: {
        id: update.data.id,
        conversationId: update.data.conversation_id,
        senderId: update.data.sender_id,
        receiverId: update.data.receiver_id,
        content: update.data.content,
        isRead: update.data.is_read,
        readAt: update.data.read_at ?? undefined,
        createdAt: update.data.created_at
      }
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to mark message as read",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
