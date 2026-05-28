"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { useRealtimeConversation } from "@/hooks/use-realtime-conversation";
import { Message } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageItem } from "@/components/messages/message-item";

export function ChatView({ conversationId }: { conversationId: string }) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const user = useAuthStore((state) => state.user);

  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => apiFetch<{ messages: Message[]; total: number }>(`/api/conversations/${conversationId}/messages`),
    refetchInterval: 5_000
  });

  useRealtimeConversation(conversationId, () => void query.refetch());

  const messages = query.data?.messages ?? [];

  const resizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const resetTextareaHeight = () => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "";
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
    resizeTextarea(event.target);
  };

  const handleSend = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSending) {
      return;
    }

    setIsSending(true);
    setContent("");
    resetTextareaHeight();

    try {
      await apiFetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: trimmedContent })
      });
      await query.refetch();
    } catch (error) {
      console.error("[messages] Unable to send message.", error);
      setContent(trimmedContent);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          resizeTextarea(textareaRef.current);
        }
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (content.trim() && !isSending) {
        void handleSend();
      }
    }
  };

  return (
    <div className="cortex-panel flex h-[700px] flex-col p-6">
      <div className="border-b border-black/10 pb-4 dark:border-white/10">
        <div className="eyebrow">Chat View</div>
        <div className="mt-2 text-2xl">Direct conversation</div>
      </div>

      <div className="scrollbar-hidden mt-5 flex-1 space-y-4 overflow-y-auto">
        {query.isLoading ? (
          <div className="text-sm text-black/60 dark:text-white/60">Loading messages...</div>
        ) : query.isError ? (
          <div className="text-sm text-black/60 dark:text-white/60">
            {query.error instanceof Error ? query.error.message : "Unable to load this conversation."}
          </div>
        ) : messages.length ? (
          messages.map((message) => (
            <MessageItem key={message.id} message={message} isOwn={message.senderId === user?.id} />
          ))
        ) : (
          <div className="text-sm text-black/60 dark:text-white/60">No messages in this conversation yet.</div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          className="min-h-[96px]"
        />
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={content.trim() === "" || isSending}
          >
            {isSending ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </div>
    </div>
  );
}
