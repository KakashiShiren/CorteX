"use client";

import { format } from "date-fns";

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="eyebrow">Dashboard</div>
        <h1 className="mt-3 text-4xl sm:text-[2.85rem]">Campus command center</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-black/56 dark:text-white/58">
          Start with one question, keep your status current, and move through Cortex without the interface getting in your way.
        </p>
      </div>
      <div className="rounded-full border border-cortex-gold/24 bg-white/65 px-4 py-2 text-sm text-cortex-garnet/72 dark:border-cortex-gold/20 dark:bg-white/[0.04] dark:text-cortex-gold/74">
        {format(new Date(), "EEEE, MMMM d 'at' h:mm a")}
      </div>
    </div>
  );
}
