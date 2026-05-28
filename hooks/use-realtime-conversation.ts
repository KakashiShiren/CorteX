"use client";

import { useMessagesRealtime } from "@/hooks/realtime/useMessagesRealtime";

export function useRealtimeConversation(conversationId: string, onRefetch: () => void) {
  useMessagesRealtime(conversationId, onRefetch);
}
