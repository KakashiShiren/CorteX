import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-2xl border border-black/8 bg-[#fffaf3]/88 px-4 text-sm text-[#1C1A17] caret-[#1C1A17] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition placeholder:text-black/42 focus:border-[rgb(var(--campus-ring))]/55 focus:ring-2 focus:ring-[rgb(var(--campus-ring))]/15 disabled:text-black/52 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:caret-white dark:placeholder:text-white/36 dark:focus:border-[rgb(var(--campus-ring))]/40 dark:focus:ring-[rgb(var(--campus-ring))]/10",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
