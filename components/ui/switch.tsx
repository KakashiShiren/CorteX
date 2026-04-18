"use client";

import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-7 w-12 rounded-full transition",
        checked ? "bg-cortex-ember" : "bg-black/10 dark:bg-white/10"
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-white transition",
          checked ? "left-6" : "left-1"
        )}
      />
    </button>
  );
}
