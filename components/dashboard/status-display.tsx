"use client";

import { useState } from "react";

import { useStatusStore } from "@/stores/status-store";
import { Button } from "@/components/ui/button";
import { UpdateStatusModal } from "@/components/dashboard/update-status-modal";

function formatStatusExpiry(expiresAt: string) {
  const remainingMinutes = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60_000));

  if (remainingMinutes <= 1) {
    return "Expires in under a minute.";
  }

  if (remainingMinutes < 60) {
    return `Expires in ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}.`;
  }

  if (remainingMinutes < 24 * 60) {
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    if (!minutes) {
      return `Expires in ${hours} hour${hours === 1 ? "" : "s"}.`;
    }

    return `Expires in ${hours} hour${hours === 1 ? "" : "s"} ${minutes} min.`;
  }

  return `Visible until ${new Date(expiresAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  })}.`;
}

export function StatusDisplay() {
  const status = useStatusStore((state) => state.currentStatus);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="cortex-panel p-6">
        <div className="eyebrow">Status</div>
        {status ? (
          <>
            <div className="mt-4 flex items-center gap-3 text-2xl font-semibold">
              <span>{status.emoji}</span>
              <span>{status.location ? `${status.location}` : "Visible to Clark"}</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-black/56 dark:text-white/58">
              {status.customText || "Your current activity is visible to verified students right now."}
            </p>
            {status.durationMinutes ? (
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-black/42 dark:text-white/44">
                Selected window:{" "}
                {status.durationMinutes >= 60 && status.durationMinutes % 60 === 0
                  ? `${status.durationMinutes / 60} hour${status.durationMinutes === 60 ? "" : "s"}`
                  : `${status.durationMinutes} min`}
              </p>
            ) : null}
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-black/42 dark:text-white/44">
              {formatStatusExpiry(status.expiresAt)}
            </p>
          </>
        ) : (
          <>
            <div className="mt-4 text-2xl font-semibold">No active status</div>
            <p className="mt-3 text-sm leading-7 text-black/56 dark:text-white/58">
              Share what you are doing right now so classmates can find you faster.
            </p>
          </>
        )}
        <div className="mt-6">
          <Button onClick={() => setOpen(true)}>{status ? "Edit Status" : "Update Status"}</Button>
        </div>
      </div>
      <UpdateStatusModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
