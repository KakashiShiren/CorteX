import { cn } from "@/lib/utils";

export function Badge({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-cortex-ember/15 bg-cortex-ember/8 px-3 py-1 text-xs font-medium text-cortex-garnet dark:border-cortex-gold/20 dark:bg-cortex-gold/10 dark:text-cortex-gold",
        className
      )}
    >
      {children}
    </span>
  );
}
