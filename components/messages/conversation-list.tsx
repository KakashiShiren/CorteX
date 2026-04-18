"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { useDashboardStore } from "@/stores/dashboard-store";

export function ConversationList({ conversations }: { conversations: Array<any> }) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const setUnreadCount = useDashboardStore((state) => state.setUnreadCount);

  useEffect(() => {
    setUnreadCount(conversations.length);
  }, [conversations.length, setUnreadCount]);

  const filtered = useMemo(
    () =>
      conversations.filter((conversation) =>
        conversation.peer?.name?.toLowerCase().includes(search.toLowerCase())
      ),
    [conversations, search]
  );

  return (
    <div className="cortex-panel p-6">
      <div className="eyebrow">Messages</div>
      <div className="mt-3 text-2xl">Conversations</div>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search conversations"
        className="mt-5 h-11 w-full rounded-2xl border border-black/10 bg-white/80 px-4 text-sm outline-none dark:border-white/10 dark:bg-white/5"
      />
      <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
        {filtered.length ? (
          filtered.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className={`block rounded-[22px] border p-4 transition ${
                pathname === `/messages/${conversation.id}`
                  ? "border-cortex-ember bg-cortex-ember/10"
                  : "border-black/10 hover:border-cortex-ember/25 dark:border-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar name={conversation.peer?.name ?? "Clark Student"} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{conversation.peer?.name}</div>
                  <div className="truncate text-xs text-black/50 dark:text-white/50">
                    {conversation.lastMessage || "No messages yet"}
                  </div>
                </div>
                <div className="text-xs text-black/45 dark:text-white/45">
                  {new Date(conversation.lastMessageAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric"
                  })}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-sm text-black/60 dark:text-white/60">No messages yet.</div>
        )}
      </div>
    </div>
  );
}
