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
    body: "Get campus answers with citations when they are available.",
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
    <div className="cortex-panel hover-lift overflow-hidden">
      <div className="grid divide-y divide-black/6 md:grid-cols-2 md:divide-x md:divide-y-0 dark:divide-white/8 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group px-6 py-6 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/45 dark:hover:bg-white/[0.03]"
            >
              <div className="grid h-11 w-11 place-items-center rounded-full border border-black/8 bg-white/48 text-cortex-garnet transition group-hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.05] dark:text-cortex-gold">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-lg font-semibold">{item.title}</div>
              <p className="mt-2 text-sm leading-7 text-black/56 dark:text-white/58">{item.body}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
