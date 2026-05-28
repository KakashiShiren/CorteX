"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, Unlink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type CanvasIntegrationResponse = {
  connected: boolean;
  integration?: {
    canvasBaseUrl?: string;
    lastSyncedAt?: string | null;
  };
  courses: Array<{
    id: string;
    name: string;
    assignmentsCount: number;
  }>;
  assignmentsCount: number;
};

function formatSync(date?: string | null) {
  if (!date) {
    return "Not synced yet";
  }

  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60_000));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}

export function CanvasSettingsSection() {
  const queryClient = useQueryClient();
  const integrationQuery = useQuery({
    queryKey: ["canvas-integration"],
    queryFn: () => apiFetch<CanvasIntegrationResponse>("/api/canvas/integration"),
    retry: false
  });
  const data = integrationQuery.data;

  const refresh = async () => {
    await apiFetch("/api/canvas/assignments/sync", { method: "POST" });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["canvas-integration"] }),
      queryClient.invalidateQueries({ queryKey: ["canvas-assignments"] }),
      queryClient.invalidateQueries({ queryKey: ["canvas-assignments-widget"] })
    ]);
  };

  const disconnect = async () => {
    await apiFetch("/api/canvas/integration", { method: "DELETE" });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["canvas-integration"] }),
      queryClient.invalidateQueries({ queryKey: ["canvas-assignments"] }),
      queryClient.invalidateQueries({ queryKey: ["canvas-assignments-widget"] })
    ]);
  };

  return (
    <div className="cortex-panel p-6 sm:p-8">
      <div className="eyebrow">Canvas</div>
      <div className="mt-3 text-3xl">Connect Your Canvas Account</div>
      <p className="mt-3 text-sm leading-7 text-black/58 dark:text-white/60">
        See your assignment deadlines in Grove.
      </p>

      {integrationQuery.isLoading ? (
        <div className="mt-8 h-32 animate-pulse rounded-[22px] bg-black/8 dark:bg-white/8" />
      ) : data?.connected ? (
        <div className="mt-8 space-y-6">
          <div className="rounded-[22px] border border-[#3f5f55]/18 bg-[#3f5f55]/8 p-5 text-sm text-[#2f5147] dark:text-[#b6d2c9]">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Canvas connected
            </div>
            <div className="mt-2 text-xs">Last synced: {formatSync(data.integration?.lastSyncedAt)}</div>
          </div>

          <div>
            <div className="micro-label">Connected Courses</div>
            <div className="mt-3 space-y-2">
              {data.courses.length ? data.courses.map((course) => (
                <div key={course.id} className="rounded-[18px] border border-black/8 bg-white/38 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.04]">
                  {course.name} · {course.assignmentsCount} assignment{course.assignmentsCount === 1 ? "" : "s"}
                </div>
              )) : (
                <div className="rounded-[18px] border border-black/8 bg-white/38 px-4 py-3 text-sm text-black/54 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/56">
                  No courses synced yet.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => void refresh()} disabled={integrationQuery.isFetching}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Assignments
            </Button>
            <Button variant="secondary" onClick={() => void disconnect()}>
              <Unlink className="mr-2 h-4 w-4" />
              Disconnect Canvas
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-[24px] border border-black/8 bg-white/38 p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-lg font-semibold">Canvas not connected</div>
          <p className="mt-2 text-sm leading-7 text-black/56 dark:text-white/58">
            Click below to sync your courses and assignments.
          </p>
          <Button className="mt-5" onClick={() => { window.location.href = "/api/auth/canvas"; }}>
            Connect to Canvas
          </Button>
        </div>
      )}
    </div>
  );
}
