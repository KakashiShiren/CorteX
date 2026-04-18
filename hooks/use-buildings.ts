"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { Building } from "@/lib/types";

export function useBuildings(category?: string) {
  const suffix = category ? `?category=${category}` : "";
  return useQuery({
    queryKey: ["buildings", category],
    queryFn: () => apiFetch<{ buildings: Building[] }>(`/api/campus/buildings${suffix}`),
    staleTime: Infinity
  });
}
