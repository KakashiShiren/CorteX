"use client";

import { ApiResponse } from "@/lib/types";

export async function apiFetch<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? "Request failed");
  }

  return json.data as T;
}
