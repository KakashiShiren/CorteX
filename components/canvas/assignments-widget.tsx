"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { CanvasAssignment } from "@/lib/canvas";

type AssignmentsResponse = {
  assignments: CanvasAssignment[];
  total: number;
};

function formatDueDate(date?: string) {
  if (!date) {
    return "No due date";
  }

  const due = new Date(date);
  const diff = due.getTime() - Date.now();
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  const formatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(due);

  if (days <= 0) {
    return `${formatted} · due soon`;
  }

  if (days === 1) {
    return `${formatted} · 1 day left`;
  }

  return `${formatted} · ${days} days left`;
}

function isDueSoon(date?: string) {
  if (!date) {
    return false;
  }

  return new Date(date).getTime() - Date.now() < 24 * 60 * 60 * 1000;
}

export function AssignmentsWidget() {
  const assignmentsQuery = useQuery({
    queryKey: ["canvas-assignments-widget"],
    queryFn: () => apiFetch<AssignmentsResponse>("/api/canvas/assignments?limit=3"),
    retry: false,
    staleTime: 5 * 60 * 1000
  });

  const assignments = assignmentsQuery.data?.assignments ?? [];

  return (
    <div className="cortex-panel p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="eyebrow">Your Deadlines</div>
        <Link href="/settings/canvas" className="text-xs font-semibold text-cortex-garnet underline-offset-4 hover:underline dark:text-cortex-gold">
          Canvas
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {assignmentsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-[18px] bg-black/8 dark:bg-white/8" />
          ))
        ) : assignments.length ? (
          assignments.map((assignment) => (
            <Link
              key={assignment.id}
              href="/canvas/assignments"
              className="block rounded-[18px] border border-black/8 bg-white/36 p-4 transition hover:bg-white/58 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
            >
              <div className="text-xs font-semibold text-cortex-ink dark:text-white">
                {assignment.courseName} · {assignment.assignmentName}
              </div>
              <div className={`mt-1 text-[11px] ${isDueSoon(assignment.dueDate) ? "text-[#BA7517]" : "text-black/52 dark:text-white/56"}`}>
                Due: {formatDueDate(assignment.dueDate)}
              </div>
              <div className={`mt-2 text-[11px] ${assignment.submitted || assignment.locallyDone ? "text-[#3f5f55] dark:text-[#b6d2c9]" : "text-black/48 dark:text-white/50"}`}>
                {assignment.submitted || assignment.locallyDone ? "Submitted ✓" : "Not submitted"}
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-[18px] border border-black/8 bg-white/36 p-4 text-xs leading-6 text-black/54 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/56">
            Connect Canvas to see upcoming assignments here.
          </div>
        )}
      </div>

      <Link href="/canvas/assignments" className="mt-4 inline-block text-xs font-semibold text-cortex-garnet underline-offset-4 hover:underline dark:text-cortex-gold">
        View all assignments →
      </Link>
    </div>
  );
}
