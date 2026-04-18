"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { ChatMessage as ChatMessageType } from "@/lib/types";

function renderMessageContent(content: string) {
  return content.split("\n").map((line, index) => {
    const mapMatch = line.match(/^Open on map:\s*(\/map\?[^\s]+)\s*$/i);
    if (mapMatch) {
      return (
        <div key={`${line}-${index}`} className="mt-4">
          <Link
            href={mapMatch[1]}
            className="inline-flex items-center gap-2 rounded-full border border-cortex-gold/24 bg-cortex-gold/10 px-3.5 py-2 text-sm font-medium text-cortex-ink transition hover:bg-cortex-gold/16 dark:border-cortex-gold/20 dark:bg-cortex-gold/12 dark:text-cortex-parchment dark:hover:bg-cortex-gold/18"
          >
            Open on map
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      );
    }

    return (
      <p key={`${line}-${index}`} className="text-sm leading-7">
        {line}
      </p>
    );
  });
}

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-3xl rounded-[24px] px-5 py-4 ${
          isAssistant
            ? "border border-cortex-gold/20 bg-[#fff9f1]/88 text-black shadow-[0_14px_36px_rgba(18,17,15,0.05)] dark:border-cortex-gold/16 dark:bg-white/[0.05] dark:text-white"
            : "bg-cortex-ink text-cortex-parchment shadow-glow dark:bg-cortex-gold dark:text-cortex-ink"
        }`}
      >
        <div className="space-y-0.5">{renderMessageContent(message.content)}</div>
        {message.citations?.length ? (
          <div className="mt-4 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42 dark:text-white/42">
              Citations
            </div>
            <div className="space-y-2">
              {message.citations.map((citation) => (
                <a
                  key={citation.id}
                  href={citation.source}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[18px] border border-black/6 bg-black/[0.025] px-3.5 py-3 text-xs transition hover:border-cortex-gold/30 hover:bg-black/[0.04] dark:border-white/8 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                >
                  <span className="block font-semibold text-cortex-ink dark:text-white">{citation.title}</span>
                  <span className="mt-1 block break-all text-[11px] text-black/56 dark:text-white/58">
                    {citation.source}
                  </span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-black/62 dark:text-white/64">
                    Open source
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
