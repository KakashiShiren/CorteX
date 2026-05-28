"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";

import { activityOptions, statusDurationOptions, statusDurationValues } from "@/lib/constants";
import { apiFetch } from "@/lib/api";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useStatusStore } from "@/stores/status-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserStatus } from "@/lib/types";

function resolveInitialDurationMinutes(status?: UserStatus | null) {
  if (status?.durationMinutes && statusDurationValues.includes(status.durationMinutes as (typeof statusDurationValues)[number])) {
    return status.durationMinutes;
  }

  const expiresAt = status?.expiresAt;
  if (!expiresAt) {
    return 60;
  }

  const remainingMinutes = Math.max(1, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60_000));
  const exactMatch = statusDurationValues.find((value) => value === remainingMinutes);
  if (exactMatch) {
    return exactMatch;
  }

  return statusDurationValues.reduce((closest, value) =>
    Math.abs(value - remainingMinutes) < Math.abs(closest - remainingMinutes) ? value : closest
  );
}

export function UpdateStatusModal({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const currentStatus = useStatusStore((state) => state.currentStatus);
  const setStatus = useStatusStore((state) => state.setStatus);
  const { data: session } = useAuthSession();
  const queryClient = useQueryClient();
  const [activity, setActivity] = useState(currentStatus?.activity ?? "studying");
  const [location, setLocation] = useState(currentStatus?.location ?? "");
  const [customText, setCustomText] = useState(currentStatus?.customText ?? "");
  const [durationMinutes, setDurationMinutes] = useState(resolveInitialDurationMinutes(currentStatus));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setActivity(currentStatus?.activity ?? "studying");
      setLocation(currentStatus?.location ?? "");
      setCustomText(currentStatus?.customText ?? "");
      setDurationMinutes(resolveInitialDurationMinutes(currentStatus));
      setErrorMessage(null);
    }
  }, [
    currentStatus?.activity,
    currentStatus?.customText,
    currentStatus?.durationMinutes,
    currentStatus?.expiresAt,
    currentStatus?.location,
    open
  ]);

  if (!open) {
    return null;
  }

  const universityName = session?.universityName ?? "your campus";

  const modal = (
    <div className="fixed inset-0 z-[90] bg-black/42 p-3 backdrop-blur-[3px] sm:p-4">
      <div className="flex h-full min-h-0 items-center justify-center">
        <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-black/12 bg-[#fffaf3] shadow-[0_28px_80px_rgba(18,17,15,0.28)] dark:border-white/12 dark:bg-[#17110f] sm:max-h-[calc(100vh-2rem)]">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-black/8 bg-[#fffaf3]/96 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-[#17110f]/96 sm:p-6">
            <div>
              <div className="eyebrow">Update Status</div>
              <div className="mt-3 text-xl leading-tight sm:text-2xl">Tell {universityName} what you are doing right now</div>
            </div>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {activityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setActivity(option.value)}
                  className={`rounded-[20px] border p-4 text-left transition ${
                    activity === option.value
                      ? "border-black/16 bg-black/[0.04] dark:border-white/16 dark:bg-white/[0.06]"
                      : "border-black/8 hover:border-black/14 hover:bg-black/[0.02] dark:border-white/10 dark:hover:border-white/16 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="text-2xl">{option.emoji}</div>
                  <div className="mt-3 text-base font-semibold sm:text-lg">{option.label}</div>
                  <p className="mt-2 text-sm text-black/56 dark:text-white/58">{option.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <div className="text-sm font-medium">Visible for</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {statusDurationOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDurationMinutes(option.value)}
                    className={`rounded-[18px] border px-4 py-3 text-left transition ${
                      durationMinutes === option.value
                        ? "border-cortex-ink bg-cortex-ink text-cortex-parchment shadow-[0_12px_24px_rgba(18,17,15,0.14)] dark:border-white dark:bg-white dark:text-cortex-ink"
                        : "border-black/8 hover:border-black/14 hover:bg-black/[0.02] dark:border-white/10 dark:hover:border-white/16 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="text-sm font-semibold">{option.label}</div>
                    <div
                      className={`mt-1 text-xs ${
                        durationMinutes === option.value
                          ? "text-cortex-parchment/80 dark:text-cortex-ink/76"
                          : "text-black/52 dark:text-white/56"
                      }`}
                    >
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-black/52 dark:text-white/56">
                Selected:{" "}
                <span className="font-medium text-cortex-ink dark:text-white">
                  {durationMinutes >= 60 && durationMinutes % 60 === 0
                    ? `${durationMinutes / 60} hour${durationMinutes === 60 ? "" : "s"}`
                    : `${durationMinutes} minutes`}
                </span>
              </p>
              <p className="mt-2 text-sm text-black/52 dark:text-white/56">
                Your live status will disappear automatically when this time window ends.
              </p>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Library, dining hall, gym..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom note</label>
                <Input
                  value={customText}
                  onChange={(event) => setCustomText(event.target.value)}
                  placeholder="Need CS help"
                />
              </div>
            </div>

            {errorMessage ? (
              <p className="mt-4 text-sm text-[#8f2430] dark:text-[#f1a4af]">{errorMessage}</p>
            ) : null}
          </div>

          <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-black/8 bg-[#fffaf3]/92 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-[#17110f]/94 sm:flex-row sm:p-6">
            <Button
              onClick={async () => {
                setIsSaving(true);
                setErrorMessage(null);
                try {
                  const result = await apiFetch<{ success: boolean; status: typeof currentStatus }>("/api/status", {
                    method: "POST",
                  body: JSON.stringify({ activity, location, customText, durationMinutes })
                });
                setStatus(result.status ?? null);
                void queryClient.invalidateQueries({ queryKey: ["me"] });
                onClose();
              } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : "Unable to save your status right now.");
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Status"}
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                setIsSaving(true);
                setErrorMessage(null);
                try {
                  await apiFetch("/api/status", { method: "DELETE" });
                  setStatus(null);
                  void queryClient.invalidateQueries({ queryKey: ["me"] });
                  onClose();
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : "Unable to clear your status right now.");
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
            >
              Clear Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
