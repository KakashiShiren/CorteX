"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ExternalLink, RefreshCw } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { CanvasAssignment } from "@/lib/canvas";

type AssignmentsResponse = {
  assignments: CanvasAssignment[];
  total: number;
};

type SortMode = "due" | "course" | "name";

function formatDue(date?: string) {
  if (!date) {
    return "No due date";
  }

  const due = new Date(date);
  const days = Math.ceil((due.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  const formatted = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(due);

  if (days <= 0) return `${formatted} · today`;
  if (days === 1) return `${formatted} · 1 day`;
  return `${formatted} · ${days} days`;
}

function descriptionText(description?: string) {
  if (!description) {
    return "";
  }

  return description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function AssignmentsPageClient() {
  const queryClient = useQueryClient();
  const [courseFilter, setCourseFilter] = useState("all");
  const [showCompleted, setShowCompleted] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("due");
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [expandedAssignmentIds, setExpandedAssignmentIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const assignmentsQuery = useQuery({
    queryKey: ["canvas-assignments", showCompleted],
    queryFn: () => apiFetch<AssignmentsResponse>(`/api/canvas/assignments?upcoming=true&limit=250${showCompleted ? "" : "&submitted=false"}`),
    retry: false
  });

  const assignments = useMemo(() => {
    let next = assignmentsQuery.data?.assignments ?? [];

    if (courseFilter !== "all") {
      next = next.filter((assignment) => assignment.canvasCourseId === courseFilter);
    }

    if (!showCompleted) {
      next = next.filter((assignment) => !assignment.submitted && !assignment.locallyDone);
    }

    next = [...next].sort((a, b) => {
      if (sortMode === "course") {
        return a.courseName.localeCompare(b.courseName);
      }

      if (sortMode === "name") {
        return a.assignmentName.localeCompare(b.assignmentName);
      }

      return new Date(a.dueDate ?? "9999-12-31").getTime() - new Date(b.dueDate ?? "9999-12-31").getTime();
    });

    return next;
  }, [assignmentsQuery.data?.assignments, courseFilter, showCompleted, sortMode]);

  const courses = useMemo(() => {
    const courseMap = new Map<string, string>();
    for (const assignment of assignmentsQuery.data?.assignments ?? []) {
      courseMap.set(assignment.canvasCourseId, assignment.courseName);
    }
    return Array.from(courseMap.entries()).map(([id, name]) => ({ id, name }));
  }, [assignmentsQuery.data?.assignments]);

  const grouped = useMemo(() => {
    const map = new Map<string, CanvasAssignment[]>();
    for (const assignment of assignments) {
      const key = assignment.canvasCourseId || assignment.courseName;
      map.set(key, [...(map.get(key) ?? []), assignment]);
    }
    return Array.from(map.entries()).map(([courseId, items]) => ({
      courseId,
      courseName: items[0]?.courseName ?? "Canvas course",
      items
    }));
  }, [assignments]);

  const refresh = async () => {
    try {
      await apiFetch("/api/canvas/assignments/sync", { method: "POST" });
      setToastMessage("Assignments refreshed.");
      await queryClient.invalidateQueries({ queryKey: ["canvas-assignments"] });
      await queryClient.invalidateQueries({ queryKey: ["canvas-assignments-widget"] });
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Unable to refresh assignments.");
    }
  };

  const toggleDone = async (assignment: CanvasAssignment) => {
    try {
      await apiFetch<CanvasAssignment>("/api/canvas/assignments", {
        method: "PATCH",
        body: JSON.stringify({
          assignmentId: assignment.id,
          locallyDone: !assignment.locallyDone
        })
      });
      await queryClient.invalidateQueries({ queryKey: ["canvas-assignments"] });
      await queryClient.invalidateQueries({ queryKey: ["canvas-assignments-widget"] });
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Unable to update assignment.");
    }
  };

  return (
    <AppShell>
      {toastMessage ? <div className="toast-surface">{toastMessage}</div> : null}

      <div className="space-y-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="page-kicker">Canvas</div>
            <h1 className="page-title mt-3">Assignments</h1>
            <p className="page-subtitle mt-3">Upcoming deadlines synced from Canvas.</p>
          </div>
          <Button onClick={() => void refresh()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Now
          </Button>
        </div>

        <div className="cortex-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            className="h-11 rounded-full border border-black/8 bg-[#fffaf3]/88 px-4 text-sm text-cortex-ink outline-none dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          >
            <option value="all">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 rounded-full border border-black/8 bg-white/40 px-4 py-3 text-sm text-black/62 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/64">
            <input type="checkbox" checked={showCompleted} onChange={(event) => setShowCompleted(event.target.checked)} className="accent-[#3f5f55]" />
            Show completed
          </label>

          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="h-11 rounded-full border border-black/8 bg-[#fffaf3]/88 px-4 text-sm text-cortex-ink outline-none dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          >
            <option value="due">Due date</option>
            <option value="course">Course</option>
            <option value="name">Name</option>
          </select>
        </div>

        {assignmentsQuery.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-[24px] border border-black/8 bg-white/44 dark:border-white/10 dark:bg-white/[0.04]" />
            ))}
          </div>
        ) : grouped.length ? (
          <div className="space-y-4">
            {grouped.map((course) => {
              const expanded = expandedCourses.includes(course.courseId);
              return (
                <section key={course.courseId} className="cortex-panel overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCourses((current) =>
                        expanded ? current.filter((id) => id !== course.courseId) : [...current, course.courseId]
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <div className="font-display text-2xl">{course.courseName}</div>
                    <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
                  </button>

                  {expanded ? (
                    <div className="border-t border-black/8 px-6 py-4 dark:border-white/10">
                      <div className="space-y-3">
                        {course.items.map((assignment) => {
                          const assignmentExpanded = expandedAssignmentIds.includes(assignment.id);
                          const done = assignment.submitted || assignment.locallyDone;
                          return (
                            <div key={assignment.id} className="rounded-[20px] border border-black/8 bg-white/34 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedAssignmentIds((current) =>
                                    assignmentExpanded
                                      ? current.filter((id) => id !== assignment.id)
                                      : [...current, assignment.id]
                                  )
                                }
                                className="block w-full text-left"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <div className="text-sm font-semibold">{assignment.assignmentName}</div>
                                    <div className="mt-1 text-xs text-black/52 dark:text-white/56">Due: {formatDue(assignment.dueDate)}</div>
                                  </div>
                                  <div className={`text-xs ${done ? "text-[#3f5f55] dark:text-[#b6d2c9]" : "text-black/48 dark:text-white/50"}`}>
                                    {done ? "Submitted ✓" : "Not submitted"}
                                  </div>
                                </div>
                              </button>
                              {assignmentExpanded ? (
                                <div className="mt-4 border-t border-black/8 pt-4 text-xs leading-6 text-black/60 dark:border-white/10 dark:text-white/62">
                                  {assignment.description ? (
                                    <p>{descriptionText(assignment.description)}</p>
                                  ) : (
                                    <p>No assignment description synced.</p>
                                  )}
                                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                    {assignment.canvasUrl ? (
                                      <Button variant="secondary" size="sm" onClick={() => window.open(assignment.canvasUrl, "_blank", "noopener,noreferrer")}>
                                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                        Open in Canvas
                                      </Button>
                                    ) : null}
                                    <Button variant="secondary" size="sm" onClick={() => void toggleDone(assignment)}>
                                      {assignment.locallyDone ? "Mark not done" : "Mark done locally"}
                                    </Button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="cortex-panel empty-state">
            <div className="font-display text-[2rem]">No upcoming assignments.</div>
            <p className="mt-3 text-sm leading-7 text-black/56 dark:text-white/58">
              Connect Canvas or refresh your sync from settings.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
