"use client";

import { FormEvent, useState } from "react";
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
  const user = useAuthStore((state) => state.user);

  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => apiFetch<{ messages: Message[]; total: number }>(`/api/conversations/${conversationId}/messages`),
    refetchInterval: 5_000
  });

  useRealtimeConversation(conversationId, () => void query.refetch());

  const messages = query.data?.messages ?? [];

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }

    await apiFetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content })
    });
    setContent("");
    await query.refetch();
  };

  return (
    <div className="cortex-panel flex h-[700px] flex-col p-6">
      <div className="border-b border-black/10 pb-4 dark:border-white/10">
        <div className="eyebrow">Chat View</div>
        <div className="mt-2 text-2xl">Direct conversation</div>
      </div>

      <div className="scrollbar-hidden mt-5 flex-1 space-y-4 overflow-y-auto">
        {messages.length ? (
          messages.map((message) => (
            <MessageItem key={message.id} message={message} isOwn={message.senderId === user?.id} />
          ))
        ) : (
          <div className="text-sm text-black/60 dark:text-white/60">No messages in this conversation yet.</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write a message..."
          className="min-h-[96px]"
        />
        <div className="flex justify-end">
          <Button type="submit">Send Message</Button>
        </div>
      </form>
    </div>
  );
}
