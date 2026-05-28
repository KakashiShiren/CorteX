"use client";

import { useMemo } from "react";

import { useSupabaseSubscription } from "@/hooks/realtime/useSupabaseSubscription";

export function useFeedRealtime(universityId: string | undefined, onChange: () => void) {
  const channelName = useMemo(
    () => (universityId ? `feed-posts:${universityId}` : null),
    [universityId]
  );

  useSupabaseSubscription(
    {
      channelName,
      table: "posts",
      event: "*",
      filter: universityId ? `university_id=eq.${universityId}` : undefined,
      enabled: Boolean(universityId)
    },
    onChange
  );
}
