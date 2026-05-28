import { fail, ok, requireUserId } from "@/lib/http";
import { hasAcceptedConnection } from "@/lib/supabase/connections";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { Message } from "@/lib/types";

type ConversationRow = {
  id: string;
  participant_ids: string[];
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

const conversationSelect = "id, participant_ids";
const messageSelect = "id, conversation_id, sender_id, receiver_id, content, is_read, read_at, created_at";

function mapMessageRow(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    content: row.content,
    isRead: row.is_read,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at
  };
}

async function getConversationForUser(
  conversationId: string,
  userId: string
): Promise<{ conversation: ConversationRow | null; error?: string }> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return {
      conversation: null,
      error: "Supabase is not configured for messages."
    };
  }

  const query = await supabase
    .from("conversations")
    .select(conversationSelect)
    .eq("id", conversationId)
    .contains("participant_ids", [userId])
    .maybeSingle();

  if (query.error) {
    return {
      conversation: null,
      error: query.error.message
    };
  }

  return {
    conversation: (query.data ?? null) as ConversationRow | null
  };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { conversation, error } = await getConversationForUser(params.id, userId);

    if (error) {
      return fail(error, 500);
    }

    if (!conversation) {
      return fail("Conversation not found.", 404);
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return fail("Supabase is not configured for messages.", 500);
    }

    const messagesQuery = await supabase
      .from("messages")
      .select(messageSelect)
      .eq("conversation_id", params.id)
      .order("created_at", { ascending: true });

    if (messagesQuery.error) {
      return fail(messagesQuery.error.message, 500);
    }

    const unreadIds = ((messagesQuery.data ?? []) as MessageRow[])
      .filter((message) => message.receiver_id === userId && !message.is_read)
      .map((message) => message.id);

    if (unreadIds.length) {
      await supabase
        .from("messages")
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .in("id", unreadIds);
    }

    const messages = ((messagesQuery.data ?? []) as MessageRow[]).map((message) =>
      mapMessageRow({
        ...message,
        is_read: unreadIds.includes(message.id) ? true : message.is_read,
        read_at: unreadIds.includes(message.id) ? new Date().toISOString() : message.read_at
      })
    );

    return ok({
      messages,
      total: messages.length
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load messages",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const body = (await request.json()) as Partial<{ content: string }>;
    const content = body.content?.trim();

    if (!content) {
      return fail("Write a message before sending.");
    }

    const { conversation, error } = await getConversationForUser(params.id, userId);

    if (error) {
      return fail(error, 500);
    }

    if (!conversation) {
      return fail("Conversation not found.", 404);
    }

    const receiverId = conversation.participant_ids.find((participantId) => participantId !== userId);
    if (!receiverId) {
      return fail("Conversation is missing a second participant.", 400);
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return fail("Supabase is not configured for messages.", 500);
    }

    if (!(await hasAcceptedConnection(supabase, userId, receiverId))) {
      return fail("You can only message accepted connections.", 403);
    }

    const insert = await supabase
      .from("messages")
      .insert({
        conversation_id: params.id,
        sender_id: userId,
        receiver_id: receiverId,
        content,
        is_read: false
      })
      .select(messageSelect)
      .single();

    if (insert.error || !insert.data) {
      return fail(insert.error?.message ?? "Unable to send message", 500);
    }

    const updateConversation = await supabase
      .from("conversations")
      .update({
        last_message: content,
        last_message_sender_id: userId,
        last_message_at: insert.data.created_at
      })
      .eq("id", params.id);

    if (updateConversation.error) {
      return fail(updateConversation.error.message, 500);
    }

    return ok({
      success: true,
      message: mapMessageRow(insert.data as MessageRow)
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to send message",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
