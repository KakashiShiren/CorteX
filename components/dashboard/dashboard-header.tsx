"use client";

import { format } from "date-fns";

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="page-kicker">Dashboard</div>
        <h1 className="page-title mt-3">Campus command center</h1>
        <p className="page-subtitle mt-3">
          Start with one question, keep your status current, and move through Grove without the interface getting in your way.
        </p>
      </div>
      <div className="rounded-full border border-cortex-gold/24 bg-white/65 px-4 py-2 text-sm text-cortex-garnet/72 dark:border-cortex-gold/20 dark:bg-white/[0.04] dark:text-cortex-gold/74">
        {format(new Date(), "EEEE, MMMM d 'at' h:mm a")}
      </div>
    </div>
  );
}
