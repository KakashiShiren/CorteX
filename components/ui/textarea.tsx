import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[120px] w-full rounded-[24px] border border-black/8 bg-[#fffaf3]/88 px-4 py-3 text-sm text-cortex-ink outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition placeholder:text-black/38 focus:border-cortex-gold/55 focus:ring-2 focus:ring-cortex-gold/15 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/32 dark:focus:border-cortex-gold/40 dark:focus:ring-cortex-gold/10",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
