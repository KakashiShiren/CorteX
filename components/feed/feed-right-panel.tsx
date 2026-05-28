"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { FeedAvatar } from "@/components/feed/feed-avatar";
import {
  type CampusStudent,
  deriveTrendingTitle,
  formatRemainingTime,
  getCompactStatusLabel,
  getPulseDensityLabel,
  getStatusProgress,
  isFreeNowStatus
} from "@/components/feed/helpers";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { TrendingFeedPost } from "@/lib/types";

type TrendingPostsResponse = {
  posts: TrendingFeedPost[];
  total: number;
};

type PulseProfileItem = {
  name: string;
  keywords: string[];
  activities: string[];
};

const pulseProfiles: Record<string, PulseProfileItem[]> = {
  "clarku.edu": [
    { name: "Library", keywords: ["library", "goddard"], activities: ["at_library"] },
    { name: "Kneller", keywords: ["kneller", "gym"], activities: ["working_out"] },
    { name: "HUC Dining", keywords: ["huc", "higgins", "dining"], activities: ["eating"] },
    { name: "Red Square", keywords: ["red square"], activities: [] },
    { name: "The Grind", keywords: ["grind"], activities: [] }
  ],
  "northeastern.edu": [
    { name: "Snell", keywords: ["snell", "library"], activities: ["at_library"] },
    { name: "Marino", keywords: ["marino", "gym"], activities: ["working_out"] },
    { name: "Curry", keywords: ["curry", "student center"], activities: ["eating"] },
    { name: "Law Library", keywords: ["law library"], activities: [] },
    { name: "Afterhours", keywords: ["afterhours"], activities: [] }
  ],
  "wpi.edu": [
    { name: "Gordon Library", keywords: ["gordon", "library"], activities: ["at_library"] },
    { name: "Rec Center", keywords: ["rec center", "gym"], activities: ["working_out"] },
    { name: "Goat's Head", keywords: ["goat"], activities: ["eating"] },
    { name: "Unity Hall", keywords: ["unity"], activities: [] },
    { name: "Institute Park", keywords: ["institute park"], activities: [] }
  ],
  "bu.edu": [
    { name: "Mugar", keywords: ["mugar", "library"], activities: ["at_library"] },
    { name: "FitRec", keywords: ["fitrec", "gym"], activities: ["working_out"] },
    { name: "GSU", keywords: ["gsu", "george sherman"], activities: ["eating"] },
    { name: "Bay State Underground", keywords: ["bay state underground"], activities: [] },
    { name: "Charles River", keywords: ["charles"], activities: [] }
  ]
};

function buildPulseData(students: CampusStudent[], universityDomain?: string | null) {
  const profile = pulseProfiles[universityDomain?.toLowerCase() ?? ""] ?? pulseProfiles["clarku.edu"];
  const counts = Object.fromEntries(profile.map((item) => [item.name, 0])) as Record<string, number>;

  for (const student of students) {
    const status = student.currentStatus;
    if (!status) {
      continue;
    }

    const location = (status.location ?? "").toLowerCase();
    const activity = status.activity;

    for (const item of profile) {
      if (item.keywords.some((keyword) => location.includes(keyword)) || item.activities.includes(activity)) {
        counts[item.name] += 1;
      }
    }
  }

  const maxCount = Math.max(1, ...Object.values(counts));

  return Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    ratio: count / maxCount,
    density: getPulseDensityLabel(count)
  }));
}

export function FeedRightPanel({
  campusStudents,
  connectedStudents,
  connectedIds,
  isLoading,
  universityDomain,
  onStudentAction,
  onJumpToPost
}: {
  campusStudents: CampusStudent[];
  connectedStudents: CampusStudent[];
  connectedIds: string[];
  isLoading?: boolean;
  universityDomain?: string | null;
  onStudentAction: (studentId: string, isConnected: boolean) => Promise<void> | void;
  onJumpToPost: (postId: string) => Promise<void> | void;
}) {
  const [now, setNow] = useState(Date.now());
  const [actingStudentId, setActingStudentId] = useState<string | null>(null);
  const connectedSet = useMemo(() => new Set(connectedIds), [connectedIds]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const trendingQuery = useQuery({
    queryKey: ["feed-trending-posts"],
    queryFn: () => apiFetch<TrendingPostsResponse>("/api/posts/trending"),
    staleTime: 60_000,
    refetchInterval: 60_000
  });

  const freeNowStudents = campusStudents.filter((student) => isFreeNowStatus(student.currentStatus)).slice(0, 5);
  const liveStatuses = connectedStudents
    .filter((student) => Boolean(student.currentStatus))
    .sort(
      (left, right) =>
        new Date(right.currentStatus?.createdAt ?? 0).getTime() -
        new Date(left.currentStatus?.createdAt ?? 0).getTime()
    )
    .slice(0, 4);
  const pulseData = buildPulseData(campusStudents, universityDomain);
  const trendingPosts = trendingQuery.data?.posts ?? [];

  return (
    <div className="space-y-4">
      <div className="cortex-panel hover-lift p-5">
        <div className="eyebrow">Who&apos;s Free Now</div>
        <div className="mt-4 space-y-2">
          {isLoading ? (
            <div className="text-sm text-black/56 dark:text-white/58">Loading campus availability...</div>
          ) : freeNowStudents.length ? (
            freeNowStudents.map((student) => {
              const isConnected = connectedSet.has(student.id);
              const isStudying =
                student.currentStatus?.activity === "studying" ||
                student.currentStatus?.activity === "free_to_study";
              const actionLabel = isStudying ? "Join" : "Wave";

              return (
                <div
                  key={student.id}
                  className="flex items-center gap-3 rounded-[10px] border border-black/8 bg-[#fffaf3]/88 px-3 py-2 transition hover:bg-[#f8f0e4] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                >
                  <FeedAvatar
                    name={student.name}
                    imageUrl={student.profilePictureUrl}
                    size="xs"
                    className="h-[30px] w-[30px] text-[11px]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-[#1C1A17] dark:text-white">
                      {student.name}
                    </div>
                    <div className="truncate text-[10px] text-black/48 dark:text-white/52">
                      {student.currentStatus?.activity === "studying" || student.currentStatus?.activity === "free_to_study"
                        ? `Studying${student.currentStatus?.location ? ` - ${student.currentStatus.location}` : ""}`
                        : `Free to hang${student.currentStatus?.location ? ` - ${student.currentStatus.location}` : ""}`}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 text-[9px] font-bold uppercase tracking-[0.16em]"
                    disabled={actingStudentId === student.id}
                    onClick={async () => {
                      try {
                        setActingStudentId(student.id);
                        await onStudentAction(student.id, isConnected);
                      } finally {
                        setActingStudentId(null);
                      }
                    }}
                  >
                    {actingStudentId === student.id ? "..." : actionLabel}
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="rounded-[10px] border border-dashed border-black/10 bg-[#fffaf3]/20 px-4 py-4 text-sm italic leading-6 text-[#6c6258] dark:border-white/12 dark:bg-white/[0.04] dark:text-[#cdbca9]">
              Nobody&apos;s free right now. Update your status to let people know you&apos;re around.
            </div>
          )}
        </div>
      </div>

      <div className="cortex-panel hover-lift p-5">
        <div className="eyebrow">Live Statuses</div>
        <div className="mt-4 space-y-2">
          {isLoading ? (
            <div className="text-sm text-black/56 dark:text-white/58">Loading live statuses...</div>
          ) : liveStatuses.length ? (
            liveStatuses.map((student) => (
              <div
                key={student.id}
                className="rounded-[10px] border border-black/8 bg-[#fffaf3]/88 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-[11px] font-semibold text-[#1C1A17] dark:text-white">{student.name}</div>
                  <div className="text-[9px] text-black/44 dark:text-white/48">
                    {student.currentStatus?.expiresAt ? formatRemainingTime(student.currentStatus.expiresAt) : "Ending"}
                  </div>
                </div>
                <div className="mt-2 truncate text-[11px] text-black/52 dark:text-white/56">
                  {getCompactStatusLabel(student.currentStatus)}
                </div>
                <div className="mt-3 h-[2px] rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className="progress-fill h-[2px] rounded-full bg-[#1C1A17] dark:bg-white"
                    style={{ width: `${Math.max(6, getStatusProgress(student.currentStatus, now) * 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[10px] border border-dashed border-black/10 bg-[#fffaf3]/20 px-4 py-4 text-sm italic leading-6 text-[#6c6258] dark:border-white/12 dark:bg-white/[0.04] dark:text-[#cdbca9]">
              Connected classmates will appear here whenever they share a live status.
            </div>
          )}
        </div>
      </div>

      <div className="cortex-panel hover-lift p-5">
        <div className="eyebrow">Campus Pulse</div>
        <div className="mt-4 space-y-4">
          {pulseData.map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold text-[#5A5248] dark:text-white/78">{item.name}</div>
                <div className="text-[10px] text-black/46 dark:text-white/52">{item.density}</div>
              </div>
              <div className="h-[3px] rounded-full bg-black/8 dark:bg-white/10">
                <div
                  className="progress-fill h-[3px] rounded-full bg-[#1C1A17] dark:bg-white"
                  style={{ width: `${Math.max(item.count ? 12 : 0, item.ratio * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cortex-panel hover-lift p-5">
        <div className="eyebrow">Trending This Week</div>
        <div className="mt-4 space-y-2">
          {trendingQuery.isLoading ? (
            <div className="text-sm text-black/56 dark:text-white/58">Ranking the most active posts...</div>
          ) : trendingPosts.length ? (
            trendingPosts.map((post, index) => (
              <button
                key={post.id}
                type="button"
                onClick={() => void onJumpToPost(post.id)}
                className="flex w-full items-center gap-3 rounded-[10px] border border-black/8 bg-[#fffaf3]/88 px-3 py-3 text-left transition hover:bg-[#f8f0e4] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
              >
                <div className="w-4 text-[11px] font-bold text-black/46 dark:text-white/52">{index + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-semibold text-[#1C1A17] dark:text-white">
                    {deriveTrendingTitle(post)}
                  </div>
                  <div className="mt-1 text-[10px] text-black/48 dark:text-white/52">
                    {post.postType === "event" || post.postType === "party" || post.postType === "trip"
                      ? `${post.rsvpGoingCount} going`
                      : `${post.likesCount} likes`}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-[10px] border border-dashed border-black/10 px-4 py-4 text-sm italic text-black/50 dark:border-white/10 dark:text-white/54">
              Trending posts will appear here once your campus feed warms up.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
