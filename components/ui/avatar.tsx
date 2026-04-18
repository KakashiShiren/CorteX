import { cn } from "@/lib/utils";

export function Avatar({
  name,
  size = "md",
  className
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  const sizeClass = {
    sm: "h-9 w-9 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg"
  }[size];

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-black/6 bg-[#f4efe8] font-semibold text-cortex-ink shadow-[0_10px_24px_rgba(18,17,15,0.08)] dark:border-white/10 dark:bg-white/[0.08] dark:text-white",
        sizeClass,
        className
      )}
    >
      {initials}
    </div>
  );
}
