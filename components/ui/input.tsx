import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-2xl border border-black/8 bg-[#fffaf3]/88 px-4 text-sm text-cortex-ink outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition placeholder:text-black/38 focus:border-cortex-gold/55 focus:ring-2 focus:ring-cortex-gold/15 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/32 dark:focus:border-cortex-gold/40 dark:focus:ring-cortex-gold/10",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
