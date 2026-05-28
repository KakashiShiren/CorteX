"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InfiniteData, useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Car, Megaphone, Mountain, PartyPopper, Search, type LucideIcon } from "lucide-react";

import { ApiError, apiFetch } from "@/lib/api";
import { AppShell } from "@/components/app-shell";
import { CreatePostModal } from "@/components/feed/create-post-modal";
import { FeedRightPanel } from "@/components/feed/feed-right-panel";
import { mapCampusStudentRow, type CampusStudent, type CampusStudentRow } from "@/components/feed/helpers";
import { PostCard } from "@/components/feed/post-card";
import { StatusStrip } from "@/components/feed/status-strip";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useConnections } from "@/hooks/use-connections";
import type { FeedPost, FeedPostType } from "@/lib/types";

type FeedPostsPage = {
  posts: FeedPost[];
  hasMore: boolean;
  total: number;
};

type ComposePreset = "general" | "event" | "party" | "trip" | "lostfound" | "rideshare" | "shoutout" | "photo";
type FeedFilter = "all" | FeedPostType;

const feedStudentSelect =
  "id, user_id, name, major, year, profile_picture_url, current_status, university_id, updated_at";

const feedFilters: Array<{
  label: string;
  value: FeedFilter;
}> = [
  { label: "All posts", value: "all" },
  { label: "Events", value: "event" },
  { label: "Parties", value: "party" },
  { label: "Trips", value: "trip" },
  { label: "Lost & Found", value: "lostfound" },
  { label: "Ride Share", value: "rideshare" },
  { label: "Shoutouts", value: "shoutout" }
];

const composeActions: Array<{
  emoji: string;
  label: string;
  value: ComposePreset;
}> = [
  { emoji: "📅", label: "Event", value: "event" },
  { emoji: "🎉", label: "Party", value: "party" },
  { emoji: "🏔️", label: "Trip / Hike", value: "trip" },
  { emoji: "🔍", label: "Lost & Found", value: "lostfound" },
  { emoji: "🚗", label: "Ride Share", value: "rideshare" },
  { emoji: "👏", label: "Shoutout", value: "shoutout" }
];

const composeActionIcons: Record<ComposePreset, LucideIcon> = {
  general: Megaphone,
  event: CalendarDays,
  party: PartyPopper,
  trip: Mountain,
  lostfound: Search,
  rideshare: Car,
  shoutout: Megaphone,
  photo: Search
};

function dedupePosts(posts: FeedPost[]) {
  const seen = new Set<string>();

  return posts.filter((post) => {
    if (seen.has(post.id)) {
      return false;
    }

    seen.add(post.id);
    return true;
  });
}

function mergeStudents(primary: CampusStudent[], secondary: CampusStudent[], limit: number) {
  const seen = new Set<string>();
  const merged: CampusStudent[] = [];

  for (const student of [...primary, ...secondary]) {
    if (seen.has(student.id)) {
      continue;
    }

    seen.add(student.id);
    merged.push(student);

    if (merged.length >= limit) {
      break;
    }
  }

  return merged;
}

function buildFeedQueryKey(universityId: string | undefined, filter: FeedFilter) {
  return ["feed-posts", universityId ?? "unknown", filter] as const;
}

function updatePostInCache(
  data: InfiniteData<FeedPostsPage, number> | undefined,
  updater: (post: FeedPost) => FeedPost
) {
  if (!data) {
    return data;
  }

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      posts: page.posts.map(updater)
    }))
  };
}

function prependPostsToCache(data: InfiniteData<FeedPostsPage, number> | undefined, newPosts: FeedPost[]) {
  if (!data || !data.pages.length) {
    return {
      pageParams: [1],
      pages: [
        {
          posts: dedupePosts(newPosts),
          hasMore: false,
          total: newPosts.length
        }
      ]
    } satisfies InfiniteData<FeedPostsPage, number>;
  }

  const [firstPage, ...rest] = data.pages;
  const posts = dedupePosts([...newPosts, ...firstPage.posts]);
  const total = firstPage.total + newPosts.filter((post) => !firstPage.posts.some((item) => item.id === post.id)).length;

  return {
    ...data,
    pages: [
      {
        ...firstPage,
        posts,
        total
      },
      ...rest
    ]
  };
}

function removePostFromCache(data: InfiniteData<FeedPostsPage, number> | undefined, postId: string) {
  if (!data) {
    return data;
  }

  return {
    ...data,
    pages: data.pages.map((page) => {
      const nextPosts = page.posts.filter((post) => post.id !== postId);

      return {
        ...page,
        posts: nextPosts,
        total: Math.max(0, page.total - (page.posts.length === nextPosts.length ? 0 : 1))
      };
    })
  };
}

async function fetchCampusStudents(universityId: string, currentUserId: string) {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return [];
  }

  const query = await supabase
    .from("students")
    .select(feedStudentSelect)
    .eq("is_verified", true)
    .eq("university_id", universityId)
    .neq("user_id", currentUserId)
    .not("current_status", "is", null)
    .order("updated_at", { ascending: false })
    .limit(60);

  if (query.error) {
    throw new Error(query.error.message);
  }

  return ((query.data ?? []) as CampusStudentRow[]).map(mapCampusStudentRow).filter((student) => Boolean(student.currentStatus));
}

async function fetchCircleStudents(universityId: string, currentUserId: string, connectedIds: string[]) {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return [];
  }

  const connectedStudents =
    connectedIds.length > 0
      ? await supabase
          .from("students")
          .select(feedStudentSelect)
          .eq("is_verified", true)
          .eq("university_id", universityId)
          .in("user_id", connectedIds)
      : { data: [], error: null };

  if (connectedStudents.error) {
    throw new Error(connectedStudents.error.message);
  }

  const mappedConnected = ((connectedStudents.data ?? []) as CampusStudentRow[]).map(mapCampusStudentRow);

  if (connectedIds.length >= 5) {
    return mappedConnected;
  }

  const discoveryQuery = await supabase
    .from("students")
    .select(feedStudentSelect)
    .eq("is_verified", true)
    .eq("university_id", universityId)
    .neq("user_id", currentUserId)
    .order("updated_at", { ascending: false })
    .limit(16);

  if (discoveryQuery.error) {
    throw new Error(discoveryQuery.error.message);
  }

  const discoveryStudents = ((discoveryQuery.data ?? []) as CampusStudentRow[]).map(mapCampusStudentRow);
  return mergeStudents(mappedConnected, discoveryStudents, 12);
}

function getOptimisticRsvpCount(post: FeedPost, nextStatus: "going" | "not_interested" | null) {
  let nextCount = post.rsvpGoingCount;

  if (post.viewerRsvpStatus === "going") {
    nextCount -= 1;
  }

  if (nextStatus === "going") {
    nextCount += 1;
  }

  return Math.max(0, nextCount);
}

export function FeedPageClient() {
  const router = useRouter();
  const meQuery = useAuthSession();
  const connectionsQuery = useConnections();
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");
  const [composePreset, setComposePreset] = useState<ComposePreset | undefined>(undefined);
  const [queuedPosts, setQueuedPosts] = useState<FeedPost[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const [removingPostIds, setRemovingPostIds] = useState<string[]>([]);

  const currentUser = meQuery.data;
  const universityId = currentUser?.universityId;
  const connectedIds = useMemo(
    () => connectionsQuery.data?.acceptedConnections.map((student) => student.id) ?? [],
    [connectionsQuery.data?.acceptedConnections]
  );
  const connectedIdSet = useMemo(() => new Set(connectedIds), [connectedIds]);
  const feedQueryKey = useMemo(() => buildFeedQueryKey(universityId, activeFilter), [activeFilter, universityId]);

  const feedQuery = useInfiniteQuery({
    queryKey: feedQueryKey,
    enabled: Boolean(currentUser?.id),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: "15"
      });

      if (activeFilter !== "all") {
        params.set("type", activeFilter);
      }

      return apiFetch<FeedPostsPage>(`/api/posts?${params.toString()}`);
    },
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length + 1 : undefined),
    staleTime: 30_000
  });

  const campusStudentsQuery = useQuery({
    queryKey: ["feed-campus-students", universityId, currentUser?.id],
    enabled: Boolean(universityId && currentUser?.id),
    queryFn: () => fetchCampusStudents(universityId!, currentUser!.id),
    staleTime: 30_000,
    refetchInterval: 60_000
  });

  const circleStudentsQuery = useQuery({
    queryKey: ["feed-circle-students", universityId, currentUser?.id, connectedIds.slice().sort().join(",")],
    enabled: Boolean(universityId && currentUser?.id),
    queryFn: () => fetchCircleStudents(universityId!, currentUser!.id, connectedIds),
    staleTime: 30_000,
    refetchInterval: 60_000
  });

  const posts = useMemo(
    () => dedupePosts(feedQuery.data?.pages.flatMap((page) => page.posts) ?? []),
    [feedQuery.data?.pages]
  );
  const connectedFallbackStudents = useMemo(
    () => connectionsQuery.data?.acceptedConnections.filter((student) => Boolean(student.currentStatus)) ?? [],
    [connectionsQuery.data?.acceptedConnections]
  );
  const connectedStatusStudents = useMemo(
    () => {
      const liveStudents = (circleStudentsQuery.data ?? []).filter((student) => connectedIdSet.has(student.id));
      return liveStudents.length ? liveStudents : connectedFallbackStudents;
    },
    [circleStudentsQuery.data, connectedFallbackStudents, connectedIdSet]
  );
  const campusStatusStudents = useMemo(
    () => {
      const liveStudents = campusStudentsQuery.data ?? [];
      return liveStudents.length ? liveStudents : connectedFallbackStudents;
    },
    [campusStudentsQuery.data, connectedFallbackStudents]
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !feedQuery.hasNextPage || feedQuery.isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void feedQuery.fetchNextPage();
        }
      },
      {
        rootMargin: "200px"
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [feedQuery.fetchNextPage, feedQuery.hasNextPage, feedQuery.isFetchingNextPage, posts.length]);

  useEffect(() => {
    if (!universityId) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`feed-status:${universityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_status"
        },
        () => {
          void Promise.all([
            queryClient.invalidateQueries({ queryKey: ["feed-campus-students", universityId, currentUser?.id] }),
            queryClient.invalidateQueries({
              queryKey: ["feed-circle-students", universityId, currentUser?.id]
            })
          ]);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUser?.id, queryClient, universityId]);

  useEffect(() => {
    if (!universityId) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`feed-posts:${universityId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `university_id=eq.${universityId}`
        },
        async (payload) => {
          const postId = typeof payload.new.id === "string" ? payload.new.id : null;

          if (!postId) {
            return;
          }

          const existingIds = new Set([...posts.map((post) => post.id), ...queuedPosts.map((post) => post.id)]);

          if (existingIds.has(postId)) {
            return;
          }

          try {
            const post = await apiFetch<FeedPost>(`/api/posts/${postId}`);

            if (activeFilter !== "all" && post.postType !== activeFilter) {
              return;
            }

            setQueuedPosts((current) => dedupePosts([post, ...current]));
          } catch {
            // Keep the feed steady if the record is not yet readable.
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeFilter, posts, queuedPosts, universityId]);

  useEffect(() => {
    if (!actionMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActionMessage(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [actionMessage]);

  useEffect(() => {
    if (!highlightedPostId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setHighlightedPostId(null);
    }, 2200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [highlightedPostId]);

  const mutateKnownFeedCaches = (
    updater: (
      data: InfiniteData<FeedPostsPage, number> | undefined,
      filter: FeedFilter
    ) => InfiniteData<FeedPostsPage, number> | undefined
  ) => {
    for (const filter of feedFilters.map((item) => item.value)) {
      queryClient.setQueryData<InfiniteData<FeedPostsPage, number>>(buildFeedQueryKey(universityId, filter), (current) =>
        updater(current, filter)
      );
    }
  };

  const prependPosts = (newPosts: FeedPost[]) => {
    mutateKnownFeedCaches((current, filter) => {
      const matchingPosts = filter === "all" ? newPosts : newPosts.filter((post) => post.postType === filter);
      return matchingPosts.length ? prependPostsToCache(current, matchingPosts) : current;
    });
  };

  const removePost = (postId: string) => {
    mutateKnownFeedCaches((current) => removePostFromCache(current, postId));
  };

  const scrollToPost = (postId: string) => {
    window.setTimeout(() => {
      const element = document.getElementById(`post-${postId}`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedPostId(postId);
    }, 120);
  };

  const handleRevealQueuedPosts = () => {
    if (!queuedPosts.length) {
      return;
    }

    prependPosts(queuedPosts);
    const firstQueuedId = queuedPosts[0]?.id;
    setQueuedPosts([]);

    if (firstQueuedId) {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      setHighlightedPostId(firstQueuedId);
    }
  };

  const handleOpenConversation = async (studentId: string) => {
    try {
      const conversation = await apiFetch<{ id: string }>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ peerId: studentId })
      });

      router.push(`/messages/${conversation.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setActionMessage("Connect with this student before messaging.");
        router.push(`/students/${studentId}`);
        return;
      }

      setActionMessage(error instanceof Error ? error.message : "Unable to open that conversation right now.");
    }
  };

  const handleToggleLike = async (post: FeedPost) => {
    setBusyPostId(post.id);

    try {
      const response = post.viewerHasLiked
        ? await apiFetch<{ success: boolean; newCount: number }>(`/api/posts/${post.id}/react`, {
            method: "DELETE"
          })
        : await apiFetch<{ success: boolean; newCount: number }>(`/api/posts/${post.id}/react`, {
            method: "POST"
          });

      mutateKnownFeedCaches((current) =>
        updatePostInCache(current, (item) =>
          item.id === post.id
            ? {
                ...item,
                viewerHasLiked: !post.viewerHasLiked,
                likesCount: response.newCount
              }
            : item
        )
      );
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Unable to update your reaction right now.");
    } finally {
      setBusyPostId(null);
    }
  };

  const handleChangeRsvp = async (post: FeedPost, nextStatus: "going" | "not_interested" | null) => {
    setBusyPostId(post.id);

    const previousStatus = post.viewerRsvpStatus;
    const previousCount = post.rsvpGoingCount;
    const optimisticCount = getOptimisticRsvpCount(post, nextStatus);

    mutateKnownFeedCaches((current) =>
      updatePostInCache(current, (item) =>
        item.id === post.id
          ? {
              ...item,
              viewerRsvpStatus: nextStatus ?? undefined,
              rsvpGoingCount: optimisticCount
            }
          : item
      )
    );

    try {
      const response =
        nextStatus === null
          ? await apiFetch<{ success: boolean; newCount: number }>(`/api/posts/${post.id}/rsvp`, {
              method: "DELETE"
            })
          : await apiFetch<{ success: boolean; newCount: number }>(`/api/posts/${post.id}/rsvp`, {
              method: "POST",
              body: JSON.stringify({ status: nextStatus })
            });

      mutateKnownFeedCaches((current) =>
        updatePostInCache(current, (item) =>
          item.id === post.id
            ? {
                ...item,
                viewerRsvpStatus: nextStatus ?? undefined,
                rsvpGoingCount: response.newCount
              }
            : item
        )
      );
    } catch (error) {
      mutateKnownFeedCaches((current) =>
        updatePostInCache(current, (item) =>
          item.id === post.id
            ? {
                ...item,
                viewerRsvpStatus: previousStatus,
                rsvpGoingCount: previousCount
              }
            : item
        )
      );
      setActionMessage(error instanceof Error ? error.message : "Unable to update your RSVP right now.");
    } finally {
      setBusyPostId(null);
    }
  };

  const handleDeletePost = async (post: FeedPost) => {
    setBusyPostId(post.id);

    try {
      await apiFetch<{ success: boolean }>(`/api/posts/${post.id}`, {
        method: "DELETE"
      });

      setRemovingPostIds((current) => [...current, post.id]);
      window.setTimeout(() => {
        removePost(post.id);
        setRemovingPostIds((current) => current.filter((id) => id !== post.id));
      }, 180);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Unable to delete that post right now.");
    } finally {
      setBusyPostId(null);
    }
  };

  const handleJumpToPost = async (postId: string) => {
    const existing = posts.find((post) => post.id === postId);

    if (existing) {
      scrollToPost(postId);
      return;
    }

    try {
      const post = await apiFetch<FeedPost>(`/api/posts/${postId}`);
      prependPosts([post]);

      if (activeFilter !== "all") {
        setActiveFilter("all");
      }

      scrollToPost(postId);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Unable to jump to that post right now.");
    }
  };

  return (
    <AppShell>
      {actionMessage ? <div className="toast-surface">{actionMessage}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          <StatusStrip
            currentUserName={currentUser?.name ?? "Your Status"}
            currentUserMajor={currentUser?.major}
            currentUserYear={currentUser?.year}
            currentUserImageUrl={currentUser?.profilePictureUrl}
            currentUserStatus={currentUser?.status ?? null}
            students={connectedStatusStudents}
            onOpenConversation={handleOpenConversation}
          />

          <div className="scrollbar-hidden flex gap-2 overflow-x-auto pb-1">
            {feedFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`filter-pill ${
                  activeFilter === filter.value
                    ? "filter-pill-active"
                    : "filter-pill-idle"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {queuedPosts.length ? (
            <button
              type="button"
              onClick={handleRevealQueuedPosts}
              className="w-full rounded-full border border-cortex-gold/24 bg-white/76 px-4 py-3 text-sm font-medium text-cortex-garnet shadow-[0_14px_32px_rgba(18,17,15,0.08)] transition hover:bg-white dark:border-cortex-gold/18 dark:bg-white/[0.05] dark:text-cortex-gold"
            >
              {queuedPosts.length} new post{queuedPosts.length === 1 ? "" : "s"}
            </button>
          ) : null}

          <div className="cortex-panel hover-lift p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="eyebrow">Create A Post</div>
              <Button size="sm" onClick={() => setComposePreset("general")}>
                Create
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {composeActions.map((action) => {
                const Icon = composeActionIcons[action.value];

                return (
                  <button
                    key={action.value}
                    type="button"
                    onClick={() => setComposePreset(action.value)}
                    className="compose-tile"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-black/8 bg-[#f7efe4] text-cortex-garnet dark:border-white/10 dark:bg-white/[0.06] dark:text-cortex-gold">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-cortex-ink dark:text-white">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {feedQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="cortex-panel p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-[3px] w-24 rounded-full bg-black/10 dark:bg-white/10" />
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-black/10 dark:bg-white/10" />
                      <div className="space-y-2">
                        <div className="h-3 w-28 rounded-full bg-black/10 dark:bg-white/10" />
                        <div className="h-2.5 w-20 rounded-full bg-black/8 dark:bg-white/8" />
                      </div>
                    </div>
                    <div className="h-3 w-full rounded-full bg-black/8 dark:bg-white/8" />
                    <div className="h-3 w-5/6 rounded-full bg-black/8 dark:bg-white/8" />
                    <div className="h-10 w-44 rounded-full bg-black/10 dark:bg-white/10" />
                  </div>
                </div>
              ))
            ) : posts.length ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser?.id}
                  currentUserName={currentUser?.name ?? "Grove Student"}
                  currentUserImageUrl={currentUser?.profilePictureUrl}
                  onToggleLike={handleToggleLike}
                  onChangeRsvp={handleChangeRsvp}
                  onDelete={handleDeletePost}
                  onError={(message) => setActionMessage(message)}
                  isBusy={busyPostId === post.id}
                  isHighlighted={highlightedPostId === post.id}
                  isRemoving={removingPostIds.includes(post.id)}
                />
              ))
            ) : (
              <div className="cortex-panel empty-state">
                <div className="font-display text-[2rem]">Nothing posted yet.</div>
                <p className="mt-3 text-sm leading-7 text-black/56 dark:text-white/58">
                  Be the first to post something - an event, a shoutout, or a trip. Your classmates will see it.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setComposePreset("event")}>Create your first post</Button>
                </div>
              </div>
            )}
            <div ref={sentinelRef} className="h-8" />
            {feedQuery.isFetchingNextPage ? (
              <div className="text-center text-sm text-black/52 dark:text-white/56">Loading more posts...</div>
            ) : null}
          </div>
        </div>

        <div className="hidden lg:block">
          <FeedRightPanel
            campusStudents={campusStatusStudents}
            connectedStudents={connectedStatusStudents}
            connectedIds={connectedIds}
            isLoading={campusStudentsQuery.isLoading || circleStudentsQuery.isLoading}
            universityDomain={currentUser?.universityDomain}
            onStudentAction={async (studentId, isConnected) => {
              if (isConnected) {
                await handleOpenConversation(studentId);
                return;
              }

              router.push(`/students/${studentId}`);
            }}
            onJumpToPost={handleJumpToPost}
          />
        </div>
      </div>

      <CreatePostModal
        open={Boolean(composePreset)}
        initialType={composePreset}
        onClose={() => setComposePreset(undefined)}
        onCreated={(post) => {
          if (activeFilter === "all" || activeFilter === post.postType) {
            prependPosts([post]);
          } else {
            setActionMessage("Post published. Switch filters to see it in the feed.");
          }

          setQueuedPosts((current) => current.filter((item) => item.id !== post.id));
        }}
      />
    </AppShell>
  );
}
