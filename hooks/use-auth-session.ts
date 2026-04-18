"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useStatusStore } from "@/stores/status-store";
import { UserProfile, UserStatus } from "@/lib/types";

type CurrentUserResponse = UserProfile & {
  status?: UserStatus | null;
  connectionsCount: number;
};

export function useAuthSession() {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setLoading, setError } = useAuthStore();
  const { setStatus } = useStatusStore();

  const query = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<CurrentUserResponse>("/api/users/me"),
    retry: false
  });

  useEffect(() => {
    setLoading(query.isLoading);

    if (query.data) {
      setUser(query.data);
      setStatus(query.data.status ?? null);
      setError(null);
    }

    if (query.error) {
      const message = query.error instanceof Error ? query.error.message : "Unable to load session";
      setUser(null);
      setStatus(null);
      setError(message);

      if (
        (message === "Unauthorized" || message === "Session expired. Please sign in again.") &&
        pathname !== "/signin"
      ) {
        router.replace(`/signin?redirectTo=${encodeURIComponent(pathname)}`);
      }
    }
  }, [pathname, query.data, query.error, query.isLoading, router, setError, setLoading, setStatus, setUser]);

  return query;
}
