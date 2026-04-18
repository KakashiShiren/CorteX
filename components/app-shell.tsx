"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import cortexLogo from "@/Cortex.png";
import { useAuthSession } from "@/hooks/use-auth-session";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/stores/dashboard-store";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/api";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data, isLoading } = useAuthSession();
  const unreadCount = useDashboardStore((state) => state.unreadCount);

  return (
    <div className="relative min-h-screen overflow-hidden bg-cortex-parchment text-cortex-ink dark:bg-[#110d0d] dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-mesh-radial opacity-80" />
      <div className="pointer-events-none absolute inset-0 subtle-grid opacity-[0.2] dark:opacity-[0.12]" />
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-cortex-gold/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-cortex-ember/12 blur-3xl" />

      <div className="relative min-h-screen lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-black/6 bg-gradient-to-b from-[#f8f0e3]/88 via-[#f2e7d8]/78 to-[#efe2d1]/72 px-6 py-8 backdrop-blur-xl dark:border-white/8 dark:from-[#17110f]/92 dark:via-[#120f0e]/88 dark:to-[#0f0c0b]/82 lg:flex lg:flex-col">
          <Link href="/dashboard" className="flex flex-col items-start gap-5">
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-cortex-gold/10 blur-3xl dark:bg-cortex-gold/8" />
              <Image
                src={cortexLogo}
                alt="Cortex logo"
                priority
                className="relative h-auto w-[158px] object-contain drop-shadow-[0_22px_36px_rgba(18,17,15,0.14)] dark:drop-shadow-[0_24px_40px_rgba(0,0,0,0.34)]"
              />
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-[0.34em] text-cortex-garnet/70 dark:text-cortex-gold/74">
                The Brain of the Campus
              </div>
              <div className="font-display text-[2.2rem] leading-none tracking-[-0.02em]">Cortex</div>
              <div className="text-[13px] text-black/54 dark:text-white/56">Clark University workspace</div>
            </div>
          </Link>

          <nav className="mt-12 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-full px-4 py-3 text-sm transition",
                  pathname === item.href
                    ? "bg-cortex-ink text-cortex-parchment shadow-[0_16px_32px_rgba(18,17,15,0.18)] dark:bg-white dark:text-cortex-ink"
                    : "text-black/66 hover:bg-white/58 hover:text-cortex-ink dark:text-white/66 dark:hover:bg-white/[0.06] dark:hover:text-white"
                )}
              >
                <span>{item.label}</span>
                {item.href === "/messages" && unreadCount > 0 ? (
                  <span className="rounded-full bg-cortex-gold/18 px-2 py-0.5 text-[11px] text-cortex-ink dark:bg-cortex-gold/18 dark:text-cortex-parchment">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between rounded-[28px] border border-black/6 bg-white/74 px-4 py-4 shadow-[0_18px_40px_rgba(18,17,15,0.08)] backdrop-blur-xl dark:border-white/8 dark:bg-black/20 sm:px-6 lg:px-8">
              <div>
                <div className="text-[11px] uppercase tracking-[0.3em] text-cortex-garnet/68 dark:text-cortex-gold/68">
                  Cortex Workspace
                </div>
                <div className="mt-1 text-sm text-black/58 dark:text-white/62">
                  {isLoading
                    ? "Loading your session..."
                    : `Welcome back, ${data?.name?.split(" ")[0] ?? "Clark student"}`}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                <div className="hidden sm:block">
                  <Avatar name={data?.name ?? "Clark Student"} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await apiFetch("/api/auth/logout", { method: "POST" });
                    router.push("/signin");
                    router.refresh();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>

          <nav className="sticky bottom-0 z-40 px-3 pb-3 pt-1 lg:hidden">
            <div className="grid grid-cols-6 rounded-full border border-black/6 bg-white/84 px-2 py-2 shadow-[0_18px_40px_rgba(18,17,15,0.12)] backdrop-blur-xl dark:border-white/8 dark:bg-black/44">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3 py-3 text-center text-xs transition",
                    pathname === item.href
                      ? "bg-cortex-ink text-cortex-parchment dark:bg-white dark:text-cortex-ink"
                      : "text-black/56 dark:text-white/62"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
