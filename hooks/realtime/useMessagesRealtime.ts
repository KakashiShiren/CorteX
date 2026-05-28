"use client";

import { useMemo } from "react";

import { useSupabaseSubscription } from "@/hooks/realtime/useSupabaseSubscription";

export function useMessagesRealtime(conversationId: string | undefined, onChange: () => void) {
  const channelName = useMemo(
    () => (conversationId ? `conversation:${conversationId}` : null),
    [conversationId]
  );

  useSupabaseSubscription(
    {
      channelName,
      table: "messages",
      event: "*",
      filter: conversationId ? `conversation_id=eq.${conversationId}` : undefined,
      enabled: Boolean(conversationId)
    },
    onChange
  );
}
