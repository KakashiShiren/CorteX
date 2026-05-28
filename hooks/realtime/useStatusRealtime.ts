"use client";

import { useMemo } from "react";

import { useSupabaseSubscription } from "@/hooks/realtime/useSupabaseSubscription";

export function useStatusRealtime(userIdOrUniversityId: string | undefined, onChange: () => void) {
  const channelName = useMemo(
    () => (userIdOrUniversityId ? `status:${userIdOrUniversityId}` : null),
    [userIdOrUniversityId]
  );

  useSupabaseSubscription(
    {
      channelName,
      table: "user_status",
      event: "*",
      filter: userIdOrUniversityId ? `user_id=eq.${userIdOrUniversityId}` : undefined,
      enabled: Boolean(userIdOrUniversityId)
    },
    onChange
  );
}
