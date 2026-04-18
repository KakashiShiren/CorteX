"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { SearchFilters, Student } from "@/lib/types";

export function useStudentSearch(filters: SearchFilters) {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.major) params.set("major", filters.major);
  if (filters.year) params.set("year", filters.year);
  if (filters.residence) params.set("residence", filters.residence);
  if (filters.liveStatus) params.set("liveStatus", filters.liveStatus);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  return useQuery({
    queryKey: ["students", filters],
    queryFn: () =>
      apiFetch<{ students: Student[]; total: number; hasMore: boolean }>(
        `/api/students/search?${params.toString()}`
      ),
    staleTime: 60_000
  });
}
