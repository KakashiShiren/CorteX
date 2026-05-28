"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { ConversationSummary } from "@/lib/types";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () =>
      apiFetch<{ conversations: ConversationSummary[]; total: number; unreadCount: number }>("/api/conversations"),
    refetchInterval: 5_000
  });
}
