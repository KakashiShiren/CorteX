"use client";

import { useEffect } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function useRealtimeConversation(conversationId: string, onRefetch: () => void) {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`
        },
        () => onRefetch()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, onRefetch]);
}
