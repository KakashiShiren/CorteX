"use client";

import { useStatusRealtime } from "@/hooks/realtime/useStatusRealtime";

export function useRealtimeStatus(userId: string, onRefetch: () => void) {
  useStatusRealtime(userId, onRefetch);
}
