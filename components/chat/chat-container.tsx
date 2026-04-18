"use client";

import { useEffect, useRef } from "react";

import { ChatMessage } from "@/components/chat/chat-message";
import { ChatMessage as ChatMessageType } from "@/lib/types";

export function ChatContainer({ messages }: { messages: ChatMessageType[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({
      top: ref.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  return (
    <div ref={ref} className="scrollbar-hidden cortex-panel h-[540px] space-y-4 overflow-y-auto p-5 sm:p-6">
      {messages.length ? (
        messages.map((message) => <ChatMessage key={message.id} message={message} />)
      ) : (
        <div className="flex h-full items-center justify-center text-center">
          <div>
            <div className="text-2xl font-semibold">Ask anything about Clark</div>
            <p className="mt-3 max-w-md text-sm leading-7 text-black/56 dark:text-white/58">
              Library hours, dining details, facility access, campus contacts, and study logistics all work well here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
