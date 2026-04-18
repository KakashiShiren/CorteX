"use client";

import { suggestedQuestions } from "@/lib/constants";

export function SuggestedQuestions({ onSelect }: { onSelect: (value: string) => void }) {
  return (
    <div className="cortex-panel p-6">
      <div className="eyebrow">Suggested Questions</div>
      <div className="mt-4 space-y-2">
        {suggestedQuestions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
            className="block w-full rounded-[18px] border border-black/6 bg-white/52 px-4 py-3 text-left text-sm text-black/66 transition hover:border-cortex-gold/30 hover:bg-white/82 hover:text-cortex-ink dark:border-white/8 dark:bg-white/[0.04] dark:text-white/68 dark:hover:border-cortex-gold/20 dark:hover:bg-white/[0.06]"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
