"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { FeedAvatar } from "@/components/feed/feed-avatar";
import { formatStatusExpiry, getStatusActivityLabel } from "@/components/feed/helpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserStatus } from "@/lib/types";
import type { CampusStudent } from "@/components/feed/helpers";

function StatusCircle({
  label,
  name,
  status,
  profilePictureUrl,
  onClick,
  isActive
}: {
  label?: string;
  name: string;
  status?: UserStatus;
  profilePictureUrl?: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  const active = Boolean(status);

  return (
    <button type="button" onClick={onClick} className="flex w-[68px] shrink-0 flex-col items-center gap-2 text-center">
      <div
        className={cn(
          "relative flex h-[60px] w-[60px] items-center justify-center rounded-full border bg-white/76 transition dark:bg-white/[0.05]",
          active
            ? "border-cortex-gold/60 ring-2 ring-cortex-gold/55 ring-offset-2 ring-offset-transparent"
            : "border-black/10 dark:border-white/12",
          isActive ? "border-cortex-ink/28 bg-[#fffaf3] dark:border-white/28" : ""
        )}
      >
        {status?.emoji ? (
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#f8f1e5] text-[24px] dark:bg-white/[0.08]">
            {status.emoji}
          </div>
        ) : (
          <FeedAvatar
            name={name}
            imageUrl={profilePictureUrl}
            size="md"
            className="h-[52px] w-[52px] text-sm"
          />
        )}
      </div>
      <div className="max-w-[68px] truncate text-[10px] text-black/52 dark:text-white/56">{label ?? name}</div>
    </button>
  );
}

export function StatusStrip({
  currentUserName,
  currentUserMajor,
  currentUserYear,
  currentUserImageUrl,
  currentUserStatus,
  students,
  onOpenConversation
}: {
  currentUserName: string;
  currentUserMajor?: string;
  currentUserYear?: string;
  currentUserImageUrl?: string;
  currentUserStatus?: UserStatus | null;
  students: CampusStudent[];
  onOpenConversation: (studentId: string) => Promise<void>;
}) {
  const [activeStatusId, setActiveStatusId] = useState<string | null>(null);
  const [messageStudentId, setMessageStudentId] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const activeStudent = useMemo(
    () => students.find((student) => student.id === activeStatusId) ?? null,
    [activeStatusId, students]
  );
  const activePerson =
    activeStatusId === "self"
      ? {
          id: "self",
          name: currentUserName,
          major: currentUserMajor,
          year: currentUserYear,
          profilePictureUrl: currentUserImageUrl,
          currentStatus: currentUserStatus ?? undefined,
          isSelf: true
        }
      : activeStudent
        ? { ...activeStudent, isSelf: false }
        : null;

  useEffect(() => {
    if (!activeStatusId) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setActiveStatusId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [activeStatusId]);

  return (
    <>
      <div ref={wrapperRef} className="cortex-panel hover-lift relative p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="eyebrow">Campus Status</div>
            <div className="mt-2 text-sm text-black/56 dark:text-white/58">
              See who is around right now and jump into the feed with live campus context.
            </div>
          </div>
        </div>
        <div className="scrollbar-hidden mt-5 flex gap-4 overflow-x-auto pb-2 pt-1">
          <div className="relative">
            <StatusCircle
              label="Your Status"
              name={currentUserName}
              status={currentUserStatus ?? undefined}
              profilePictureUrl={currentUserImageUrl}
              onClick={() => setActiveStatusId(activeStatusId === "self" ? null : "self")}
              isActive={activeStatusId === "self"}
            />
          </div>
          {students.map((student) => {
            const isOpen = activeStatusId === student.id;

            return (
              <div key={student.id} className="relative">
                <StatusCircle
                  name={student.name}
                  status={student.currentStatus}
                  profilePictureUrl={student.profilePictureUrl}
                  onClick={() => setActiveStatusId(isOpen ? null : student.id)}
                  isActive={isOpen}
                />
              </div>
            );
          })}
        </div>
        {activePerson ? (
          <div className="mt-5 rounded-[22px] border border-black/8 bg-[#fffaf3]/78 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <FeedAvatar
                  name={activePerson.name}
                  imageUrl={activePerson.profilePictureUrl}
                  size="sm"
                  className="h-11 w-11"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-cortex-ink dark:text-white">
                    {activePerson.name}
                  </div>
                  <div className="mt-1 truncate text-[11px] text-black/46 dark:text-white/50">
                    {[activePerson.major, activePerson.year].filter(Boolean).join(" - ") || "Student"}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <div className="rounded-full border border-black/8 bg-white/70 px-3 py-1.5 text-[12px] font-medium text-black/66 dark:border-white/8 dark:bg-white/[0.05] dark:text-white/68">
                  {activePerson.currentStatus?.emoji ? `${activePerson.currentStatus.emoji} ` : ""}
                  {activePerson.currentStatus ? getStatusActivityLabel(activePerson.currentStatus) : "No status available"}
                </div>
                <div className="text-[11px] text-black/46 dark:text-white/50">
                  {activePerson.currentStatus?.expiresAt
                    ? formatStatusExpiry(activePerson.currentStatus.expiresAt)
                    : "This student has not posted a live status yet."}
                </div>
              </div>
            </div>
            {!activePerson.isSelf ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="ghost" size="sm" onClick={() => setActiveStatusId(null)}>
                  Close
                </Button>
                <Link href={`/students/${activePerson.id}`} onClick={() => setActiveStatusId(null)}>
                  <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                    View Profile
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={messageStudentId === activePerson.id}
                  onClick={async () => {
                    try {
                      setMessageStudentId(activePerson.id);
                      await onOpenConversation(activePerson.id);
                      setActiveStatusId(null);
                    } finally {
                      setMessageStudentId(null);
                    }
                  }}
                >
                  {messageStudentId === activePerson.id ? "Opening..." : "Message"}
                </Button>
              </div>
            ) : (
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setActiveStatusId(null)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
