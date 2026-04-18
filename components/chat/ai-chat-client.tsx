"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { ChatContainer } from "@/components/chat/chat-container";
import { MessageInput } from "@/components/chat/message-input";
import { SuggestedQuestions } from "@/components/chat/suggested-questions";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { ChatConversation } from "@/lib/types";
import { useChatStore } from "@/stores/chat-store";

export function AiChatClient({ initialQuery }: { initialQuery?: string }) {
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { messages, setMessages, addMessage, clearMessages, isLoading, setLoading } = useChatStore();

  const { data, refetch } = useQuery({
    queryKey: ["ai-conversations"],
    queryFn: () => apiFetch<{ conversations: ChatConversation[] }>("/api/ai/conversations")
  });

  async function handleAsk(question: string) {
    setLoading(true);
    setErrorMessage(null);
    const previousMessages = messages;
    try {
      const optimisticUser = {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: question,
        createdAt: new Date().toISOString()
      };
      const nextMessages = [...messages, optimisticUser];
      addMessage(optimisticUser);

      const response = await apiFetch<{ response: string; citations: Array<any>; conversationId: string }>(
        "/api/ai/chat",
        {
          method: "POST",
          body: JSON.stringify({
            message: question,
            conversationId
          })
        }
      );

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: response.response,
        citations: response.citations,
        createdAt: new Date().toISOString()
      };

      setConversationId(response.conversationId);
      addMessage(assistantMessage);
      await refetch();
    } catch (error) {
      setMessages(previousMessages);
      setErrorMessage(error instanceof Error ? error.message : "Unable to reach Cortex right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const latest = data?.conversations?.[0];
    if (latest) {
      setConversationId(latest.id);
      setMessages(latest.messages);
      return;
    }
  }, [data, setMessages]);

  useEffect(() => {
    if (!initialQuery) {
      return;
    }

    if (messages.some((message) => message.content === initialQuery)) {
      return;
    }

    void handleAsk(initialQuery);
  }, [initialQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="eyebrow">Campus Assistant</div>
            <h1 className="mt-3 text-4xl">Ask the Clark campus assistant</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-black/56 dark:text-white/58">
              Ask about hours, locations, campus logistics, and student-facing resources. Answers stay grounded in the Clark knowledge base and cite the source URL.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={async () => {
              if (conversationId) {
                await apiFetch(`/api/ai/conversations/${conversationId}`, { method: "DELETE" });
              }
              clearMessages();
              setConversationId(undefined);
            }}
          >
            Clear Conversation
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <ChatContainer messages={messages} />
            {errorMessage ? (
              <div className="rounded-[20px] border border-[#8f2430]/18 bg-[#8f2430]/[0.06] px-4 py-3 text-sm text-[#8f2430] dark:border-[#f1a4af]/20 dark:bg-[#f1a4af]/[0.08] dark:text-[#f5bcc4]">
                {errorMessage}
              </div>
            ) : null}
            <MessageInput isLoading={isLoading} onSubmit={handleAsk} />
          </div>
          <SuggestedQuestions onSelect={(question) => void handleAsk(question)} />
        </div>
      </div>
    </AppShell>
  );
}
