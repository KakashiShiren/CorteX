import Link from "next/link";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/account", label: "Account" },
  { href: "/settings/privacy", label: "Privacy" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/appearance", label: "Appearance" },
  { href: "/settings/data", label: "Data" },
  { href: "/settings/help", label: "Help" }
];

export function SettingsTabs({ activeHref }: { activeHref: string }) {
  return (
    <div className="cortex-panel p-4">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm transition",
              activeHref === tab.href
                ? "bg-cortex-ember text-white"
                : "text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
