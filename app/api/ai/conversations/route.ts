import { randomUUID } from "crypto";

import { fail, ok, requireUserId } from "@/lib/http";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { ChatConversation } from "@/lib/types";

type ChatConversationRow = {
  id: string;
  user_id: string;
  messages: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
};

function normalizeMessages(messages: Array<Record<string, unknown>>) {
  return messages
    .map((message) => {
      if (typeof message.content !== "string") {
        return null;
      }

      return {
        id: typeof message.id === "string" ? message.id : randomUUID(),
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
        createdAt:
          typeof message.createdAt === "string"
            ? message.createdAt
            : typeof message.timestamp === "string"
              ? message.timestamp
              : new Date().toISOString(),
        citations: Array.isArray(message.citations) ? message.citations : undefined
      };
    })
    .filter(Boolean);
}

export async function GET() {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for AI conversations.", 500);
    }

    const query = await supabase
      .from("chat_conversations")
      .select("id, user_id, messages, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (query.error) {
      return fail(query.error.message, 500);
    }

    const conversations = ((query.data ?? []) as ChatConversationRow[]).map((conversation) => ({
      id: conversation.id,
      userId: conversation.user_id,
      messages: normalizeMessages(conversation.messages ?? []),
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at
    }));

    return ok({ conversations });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : "Unable to load AI conversations",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
