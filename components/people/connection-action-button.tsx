"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, apiFetch } from "@/lib/api";
import { StudentConnectionStatus } from "@/lib/types";
import { Button, type ButtonProps } from "@/components/ui/button";

type ConnectionStatusResponse = {
  connectionId?: string;
  connectionStatus: StudentConnectionStatus;
};

function getButtonPresentation(status: StudentConnectionStatus): Pick<ButtonProps, "className"> & { label: string; disabled?: boolean } {
  switch (status) {
    case "connected":
      return {
        label: "Message",
        className:
          "bg-[#1f7a45] text-white hover:bg-[#176136] dark:bg-[#28a05b] dark:text-white dark:hover:bg-[#22884e]"
      };
    case "incoming_pending":
      return {
        label: "Respond",
        className:
          "bg-[#f2c766] text-[#4d3210] hover:bg-[#eab54a] dark:bg-[#f2c766] dark:text-[#3d280d] dark:hover:bg-[#e0ab3b]"
      };
    case "outgoing_pending":
      return {
        label: "Pending...",
        disabled: true,
        className:
          "bg-black/10 text-black/55 hover:bg-black/10 dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/10"
      };
    default:
      return {
        label: "Connect",
        className:
          "bg-[#2563eb] text-white hover:bg-[#1d4ed8] dark:bg-[#3b82f6] dark:text-white dark:hover:bg-[#2563eb]"
      };
  }
}

export function ConnectionActionButton({
  studentId,
  initialStatus,
  initialConnectionId,
  size = "default",
  className
}: {
  studentId: string;
  initialStatus?: StudentConnectionStatus;
  initialConnectionId?: string;
  size?: ButtonProps["size"];
  className?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isActing, setIsActing] = useState(false);

  const statusQuery = useQuery({
    queryKey: ["connection-status", studentId],
    queryFn: () =>
      apiFetch<ConnectionStatusResponse>(`/api/connections/status?peerId=${encodeURIComponent(studentId)}`),
    initialData:
      initialStatus === undefined
        ? undefined
        : {
            connectionId: initialConnectionId,
            connectionStatus: initialStatus
          },
    staleTime: 15_000
  });

  const connection = statusQuery.data;

  const invalidateConnectedQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["students"] }),
      queryClient.invalidateQueries({ queryKey: ["student", studentId] }),
      queryClient.invalidateQueries({ queryKey: ["connections"] }),
      queryClient.invalidateQueries({ queryKey: ["connection-status"] }),
      queryClient.invalidateQueries({ queryKey: ["me"] }),
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    ]);
  };

  const handleClick = async () => {
    if (!connection || isActing) {
      return;
    }

    try {
      setIsActing(true);

      if (connection.connectionStatus === "connected") {
        const conversation = await apiFetch<{ id: string }>("/api/conversations", {
          method: "POST",
          body: JSON.stringify({ peerId: studentId })
        });
        router.push(`/messages/${conversation.id}`);
        return;
      }

      if (connection.connectionStatus === "incoming_pending") {
        router.push(
          connection.connectionId ? `/connections?highlight=${encodeURIComponent(connection.connectionId)}` : "/connections"
        );
        return;
      }

      const response = await apiFetch<{ connectionId: string }>("/api/connections/request", {
        method: "POST",
        body: JSON.stringify({ toUserId: studentId })
      });

      queryClient.setQueryData<ConnectionStatusResponse>(["connection-status", studentId], {
        connectionId: response.connectionId,
        connectionStatus: "outgoing_pending"
      });

      await invalidateConnectedQueries();
    } catch (error) {
      if (error instanceof ApiError) {
        const data = error.data as Partial<ConnectionStatusResponse> | undefined;
        if (data?.connectionStatus === "incoming_pending") {
          router.push(data.connectionId ? `/connections?highlight=${encodeURIComponent(data.connectionId)}` : "/connections");
          return;
        }
      }

      console.error("[connections] Failed to update connection state.", error);
      await invalidateConnectedQueries();
    } finally {
      setIsActing(false);
    }
  };

  if ((statusQuery.isLoading && !connection) || !connection) {
    return <div className={`h-11 w-28 animate-pulse rounded-full bg-black/10 dark:bg-white/10 ${className ?? ""}`} />;
  }

  const presentation = getButtonPresentation(connection.connectionStatus);

  return (
    <Button
      size={size}
      className={`${presentation.className} ${className ?? ""}`.trim()}
      disabled={presentation.disabled || isActing}
      onClick={() => void handleClick()}
    >
      {isActing && connection.connectionStatus !== "incoming_pending" ? "Loading..." : presentation.label}
    </Button>
  );
}
