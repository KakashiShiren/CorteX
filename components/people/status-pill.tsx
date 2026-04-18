import { UserStatus } from "@/lib/types";

export function StatusPill({ status }: { status?: UserStatus | null }) {
  if (!status || !status.isVisible) {
    return <span className="text-sm text-black/45 dark:text-white/45">No live status</span>;
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-black/[0.045] px-3 py-1.5 text-sm text-cortex-ink dark:bg-white/[0.08] dark:text-white">
      <span>{status.emoji}</span>
      <span>
        {status.location ? `${status.location}` : "Active"}
        {status.customText ? ` - ${status.customText}` : ""}
      </span>
    </div>
  );
}
