import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cortex-gold disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-cortex-ink px-5 py-3 text-white shadow-[0_12px_30px_rgba(18,17,15,0.16)] hover:bg-black/90 dark:bg-white dark:text-cortex-ink dark:hover:bg-white/92",
        secondary:
          "border border-black/8 bg-white/80 px-5 py-3 text-cortex-ink hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]",
        ghost:
          "px-3 py-2 text-cortex-ink hover:bg-black/[0.04] dark:text-white dark:hover:bg-white/[0.08]",
        outline:
          "border border-black/10 bg-transparent px-5 py-3 text-cortex-ink hover:border-black/16 hover:bg-black/[0.03] dark:border-white/10 dark:text-white dark:hover:bg-white/[0.06]"
      },
      size: {
        default: "h-11",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
