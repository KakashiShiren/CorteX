import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--campus-ring))] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[rgb(var(--campus-action))] px-5 py-3 text-[rgb(var(--campus-on-action))] shadow-[0_12px_28px_rgba(var(--campus-action),0.18)] hover:-translate-y-0.5 hover:brightness-95 hover:shadow-[0_16px_34px_rgba(var(--campus-action),0.22)]",
        secondary:
          "border border-black/8 bg-white/72 px-5 py-3 text-cortex-ink hover:-translate-y-0.5 hover:border-black/14 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]",
        ghost:
          "px-3 py-2 text-cortex-ink hover:bg-black/[0.045] dark:text-white dark:hover:bg-white/[0.08]",
        outline:
          "border border-black/10 bg-white/20 px-5 py-3 text-cortex-ink hover:-translate-y-0.5 hover:border-black/18 hover:bg-white/58 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:hover:bg-white/[0.06]"
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