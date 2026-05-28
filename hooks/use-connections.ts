"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { ConnectionRequest, Student } from "@/lib/types";

export type ConnectionsResponse = {
  incomingRequests: ConnectionRequest[];
  outgoingRequests: ConnectionRequest[];
  acceptedConnections: Student[];
  pendingRequestsCount: number;
};

export function useConnections() {
  return useQuery({
    queryKey: ["connections"],
    queryFn: () => apiFetch<ConnectionsResponse>("/api/connections"),
    staleTime: 30_000
  });
}
