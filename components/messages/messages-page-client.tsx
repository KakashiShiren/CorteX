"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ChatView } from "@/components/messages/chat-view";
import { ConversationList } from "@/components/messages/conversation-list";
import { Button } from "@/components/ui/button";
import { useConversations } from "@/hooks/use-conversations";

export function MessagesPageClient({ activeConversationId }: { activeConversationId?: string }) {
  const conversationsQuery = useConversations();
  const conversations = conversationsQuery.data?.conversations ?? [];
  const hasActiveConversation = Boolean(activeConversationId);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="cortex-panel hover-lift p-6 sm:p-8">
          <div className="page-kicker">Messages</div>
          <div className="page-title mt-3">Talk with your accepted connections</div>
          <p className="page-subtitle mt-4">
            Conversations open once a classmate accepts your connection request. Pick a thread to keep the conversation
            going.
          </p>
          {!conversations.length && !conversationsQuery.isLoading ? (
            <div className="mt-5">
              <Link href="/find-people?tab=connections">
                <Button>Open My Connections</Button>
              </Link>
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div>
            {conversationsQuery.isLoading ? (
              <div className="cortex-panel p-6 text-sm text-black/60 dark:text-white/60">Loading conversations...</div>
            ) : (
              <ConversationList conversations={conversations} />
            )}
          </div>

          <div>
            {hasActiveConversation ? (
              <ChatView conversationId={activeConversationId!} />
            ) : (
              <div className="cortex-panel flex min-h-[700px] flex-col items-center justify-center p-10 text-center">
                <div className="eyebrow">Ready To Chat</div>
                <div className="mt-3 text-3xl font-semibold">Choose a conversation</div>
                <p className="mt-4 max-w-md text-sm leading-7 text-black/58 dark:text-white/60">
                  Select a classmate from the left to open your messages. New conversations start from accepted
                  connections on Find People.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
