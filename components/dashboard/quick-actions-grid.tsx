import Link from "next/link";
import { Compass, MessagesSquare, Search, Sparkles } from "lucide-react";

const items = [
  {
    href: "/find-people",
    title: "Find Students",
    body: "Search by major, year, residence, or live status.",
    icon: Search
  },
  {
    href: "/map",
    title: "Campus Map",
    body: "Jump into buildings, facilities, and walking directions.",
    icon: Compass
  },
  {
    href: "/ai-chat",
    title: "Ask AI",
    body: "Get Clark-specific answers with citations.",
    icon: Sparkles
  },
  {
    href: "/messages",
    title: "Messages",
    body: "Stay close to your active conversations and requests.",
    icon: MessagesSquare
  }
];

export function QuickActionsGrid() {
  return (
    <div className="cortex-panel overflow-hidden">
      <div className="grid divide-y divide-black/6 md:grid-cols-2 md:divide-x md:divide-y-0 dark:divide-white/8 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group px-6 py-6 transition hover:bg-white/45 dark:hover:bg-white/[0.03]"
            >
              <Icon className="h-5 w-5 text-cortex-garnet dark:text-cortex-gold" />
              <div className="mt-4 text-lg font-semibold">{item.title}</div>
              <p className="mt-2 text-sm leading-7 text-black/56 dark:text-white/58">{item.body}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
