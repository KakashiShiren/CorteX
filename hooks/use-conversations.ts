"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiFetch<{ conversations: Array<any>; total: number }>("/api/conversations"),
    refetchInterval: 5_000
  });
}
