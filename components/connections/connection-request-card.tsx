"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { ConnectionRequest } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function ConnectionRequestCard({
  request,
  highlight = false
}: {
  request: ConnectionRequest;
  highlight?: boolean;
}) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["connections"] }),
      queryClient.invalidateQueries({ queryKey: ["students"] }),
      queryClient.invalidateQueries({ queryKey: ["connection-status"] }),
      queryClient.invalidateQueries({ queryKey: ["me"] }),
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    ]);
  };

  const handleDecision = async (action: "accept" | "reject") => {
    try {
      setIsSubmitting(true);
      await apiFetch(`/api/connections/${request.id}/${action}`, {
        method: "POST"
      });
      await invalidate();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`cortex-panel p-5 ${highlight ? "ring-2 ring-cortex-ember/70 dark:ring-cortex-gold/60" : ""}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            name={request.student.name}
            imageUrl={request.student.profilePictureUrl}
            avatarColor={request.student.avatarColor}
            size="lg"
          />
          <div>
            <Link
              href={`/find-people/${request.student.id}`}
              className="text-lg font-semibold transition hover:text-cortex-garnet dark:hover:text-cortex-gold"
            >
              {request.student.name}
            </Link>
            <div className="mt-1 text-sm text-black/56 dark:text-white/58">
              {request.student.major} &middot; {request.student.year}
            </div>
            <div className="mt-1 text-xs text-black/46 dark:text-white/48">
              {request.direction === "incoming" ? "Sent to you" : "Waiting for their response"} on{" "}
              {new Date(request.createdAt).toLocaleDateString([], {
                month: "short",
                day: "numeric"
              })}
            </div>
          </div>
        </div>
        {request.direction === "incoming" ? (
          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-[#1f7a45] text-white hover:bg-[#176136] dark:bg-[#28a05b] dark:hover:bg-[#22884e]"
              disabled={isSubmitting}
              onClick={() => void handleDecision("accept")}
            >
              {isSubmitting ? "Saving..." : "Accept"}
            </Button>
            <Button variant="secondary" disabled={isSubmitting} onClick={() => void handleDecision("reject")}>
              Decline
            </Button>
          </div>
        ) : (
          <Button
            disabled
            className="bg-black/10 text-black/55 hover:bg-black/10 dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/10"
          >
            Pending...
          </Button>
        )}
      </div>
    </div>
  );
}
