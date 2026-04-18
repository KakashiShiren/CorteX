import { Message } from "@/lib/types";

export function MessageItem({
  message,
  isOwn
}: {
  message: Message;
  isOwn: boolean;
}) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xl rounded-[22px] px-4 py-3 text-sm leading-7 ${
          isOwn ? "bg-cortex-ember text-white" : "bg-white/80 dark:bg-white/8"
        }`}
      >
        <div>{message.content}</div>
        <div className={`mt-2 text-xs ${isOwn ? "text-white/70" : "text-black/45 dark:text-white/45"}`}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          {isOwn && message.isRead ? " • Read" : ""}
        </div>
      </div>
    </div>
  );
}
