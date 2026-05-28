"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { FeedAvatar } from "@/components/feed/feed-avatar";
import { formatPostAge } from "@/components/feed/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { FeedComment } from "@/lib/types";

type CommentsResponse = {
  comments: FeedComment[];
  total: number;
};

export function PostComments({
  postId,
  currentUserName,
  currentUserImageUrl,
  open,
  onError,
  onCountChange
}: {
  postId: string;
  currentUserName: string;
  currentUserImageUrl?: string;
  open: boolean;
  onError: (message: string) => void;
  onCountChange: (count: number) => void;
}) {
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const query = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: () => apiFetch<CommentsResponse>(`/api/posts/${postId}/comments`),
    enabled: open,
    staleTime: 15_000
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    onCountChange(query.data?.total ?? 0);
  }, [onCountChange, open, query.data?.total]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`post-comments:${postId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_comments",
          filter: `post_id=eq.${postId}`
        },
        () => {
          void query.refetch();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [open, postId, query]);

  if (!open) {
    return null;
  }

  const comments = query.data?.comments ?? [];

  return (
    <div className="mt-4 rounded-[22px] border border-black/8 bg-white/64 p-4 dark:border-white/12 dark:bg-white/[0.07]">
      <div className="space-y-3">
        {query.isLoading ? (
          <div className="rounded-[18px] border border-black/8 bg-white/56 px-4 py-4 text-sm font-medium text-cortex-ink dark:border-white/10 dark:bg-white/[0.08] dark:text-[#f7efe3]">
            Loading comments...
          </div>
        ) : comments.length ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3 rounded-[18px] border border-black/6 bg-white/64 px-3 py-3 dark:border-white/8 dark:bg-white/[0.05]">
              <FeedAvatar
                name={comment.author.name}
                imageUrl={comment.author.profilePictureUrl}
                size="xs"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className="text-[12px] font-semibold text-cortex-ink dark:text-white">{comment.author.name}</div>
                  <div className="text-[10px] text-black/42 dark:text-white/46">{formatPostAge(comment.createdAt)}</div>
                </div>
                <div className="mt-1 text-[12px] leading-6 text-black/66 dark:text-white/70">{comment.content}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[18px] border border-dashed border-black/14 bg-[#fffaf3]/72 px-4 py-4 text-sm font-medium text-cortex-ink dark:border-white/18 dark:bg-white/[0.1] dark:text-[#f7efe3]">
            No comments yet. Start the thread.
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <FeedAvatar
          name={currentUserName}
          imageUrl={currentUserImageUrl}
          size="xs"
        />
        <Input
          ref={inputRef}
          value={content}
          onChange={(event) => setContent(event.target.value.slice(0, 300))}
          onKeyDown={(event) => {
            if (event.key === "Enter" && content.trim() && !isPosting) {
              event.preventDefault();
              void (async () => {
                try {
                  setIsPosting(true);
                  const response = await apiFetch<{ comment: FeedComment; newCount: number }>(`/api/posts/${postId}/comments`, {
                    method: "POST",
                    body: JSON.stringify({ content: content.trim() })
                  });
                  setContent("");
                  onCountChange(response.newCount);
                  await query.refetch();
                } catch (error) {
                  onError(error instanceof Error ? error.message : "Unable to post your comment right now.");
                } finally {
                  setIsPosting(false);
                  inputRef.current?.focus();
                }
              })();
            }
          }}
          placeholder="Write a comment..."
          className="h-11 rounded-full"
        />
        <Button
          size="sm"
          disabled={!content.trim() || isPosting}
          onClick={async () => {
            try {
              setIsPosting(true);
              const response = await apiFetch<{ comment: FeedComment; newCount: number }>(`/api/posts/${postId}/comments`, {
                method: "POST",
                body: JSON.stringify({ content: content.trim() })
              });
              setContent("");
              onCountChange(response.newCount);
              await query.refetch();
            } catch (error) {
              onError(error instanceof Error ? error.message : "Unable to post your comment right now.");
            } finally {
              setIsPosting(false);
              inputRef.current?.focus();
            }
          }}
        >
          {isPosting ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
}
