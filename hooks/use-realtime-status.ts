"use client";

import { useEffect } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function useRealtimeStatus(userId: string, onRefetch: () => void) {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`status:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_status",
          filter: `user_id=eq.${userId}`
        },
        () => onRefetch()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [onRefetch, userId]);
}
