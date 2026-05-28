"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { ConnectionRequestCard } from "@/components/connections/connection-request-card";
import { useConnections } from "@/hooks/use-connections";
import { useRealtimeConnections } from "@/hooks/use-realtime-connections";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

export function ConnectionsPageClient({ highlightId }: { highlightId?: string }) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const connectionsQuery = useConnections();

  useRealtimeConnections(user?.id, () => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ["connections"] }),
      queryClient.invalidateQueries({ queryKey: ["students"] }),
      queryClient.invalidateQueries({ queryKey: ["connection-status"] }),
      queryClient.invalidateQueries({ queryKey: ["me"] })
    ]);
  });

  const incomingRequests = connectionsQuery.data?.incomingRequests ?? [];
  const outgoingRequests = connectionsQuery.data?.outgoingRequests ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="cortex-panel p-6 sm:p-8">
          <div className="eyebrow">Connections</div>
          <div className="mt-3 font-display text-4xl">Incoming requests and network activity</div>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-black/58 dark:text-white/60">
            Accept a request to unlock messaging, or keep tabs on the requests you have already sent.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/find-people?tab=connections">
              <Button variant="secondary">Open My Connections</Button>
            </Link>
            <Link href="/find-people">
              <Button>Find More Students</Button>
            </Link>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow">Incoming</div>
              <div className="mt-2 text-2xl">Requests waiting on you</div>
            </div>
            <div className="text-sm text-black/55 dark:text-white/55">
              {connectionsQuery.isLoading ? "Loading..." : `${incomingRequests.length} pending`}
            </div>
          </div>
          {connectionsQuery.isLoading ? (
            <div className="cortex-panel p-8 text-sm text-black/60 dark:text-white/60">Loading requests...</div>
          ) : incomingRequests.length ? (
            <div className="space-y-4">
              {incomingRequests.map((request) => (
                <ConnectionRequestCard key={request.id} request={request} highlight={request.id === highlightId} />
              ))}
            </div>
          ) : (
            <div className="cortex-panel p-8 text-sm text-black/60 dark:text-white/60">
              No incoming requests right now.
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <div className="eyebrow">Outgoing</div>
            <div className="mt-2 text-2xl">Requests you have sent</div>
          </div>
          {connectionsQuery.isLoading ? (
            <div className="cortex-panel p-8 text-sm text-black/60 dark:text-white/60">Loading sent requests...</div>
          ) : outgoingRequests.length ? (
            <div className="space-y-4">
              {outgoingRequests.map((request) => (
                <ConnectionRequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <div className="cortex-panel p-8 text-sm text-black/60 dark:text-white/60">
              No outgoing requests yet. Start from Find People when you are ready to connect.
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
