"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Bot,
  CarFront,
  ChartNoAxesCombined,
  Home,
  House,
  LogOut,
  Map,
  MessageCircle,
  MoonStar,
  Search,
  Settings,
  ShoppingBag,
  SunMedium,
  UsersRound
} from "lucide-react";
import { useTheme } from "next-themes";

import { useAuthSession } from "@/hooks/use-auth-session";
import { useConversations } from "@/hooks/use-conversations";
import { useRealtimeConnections } from "@/hooks/use-realtime-connections";
import { navItems } from "@/lib/constants";
import { getUniversityTheme } from "@/lib/university-theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { BrandMark } from "@/components/brand-mark";
import { apiFetch } from "@/lib/api";

const navIconMap = {
  home: Home,
  dashboard: ChartNoAxesCombined,
  people: UsersRound,
  map: Map,
  ai: Bot,
  rides: CarFront,
  housing: House,
  marketplace: ShoppingBag,
  messages: MessageCircle,
  settings: Settings
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data, isLoading } = useAuthSession();
  const conversationsQuery = useConversations();
  const queryClient = useQueryClient();
  const [navFilterCounts, setNavFilterCounts] = useState<Record<string, number>>({});
  const [marketplaceBadgeCount, setMarketplaceBadgeCount] = useState(0);
  const pendingRequestsCount = data?.pendingRequestsCount ?? 0;
  const unreadCount = conversationsQuery.data?.unreadCount ?? 0;
  const universityTheme = getUniversityTheme(data?.universityDomain);
  const workspaceLabel = data?.universityName ? `${data.universityName} workspace` : "Your campus workspace";

  const handleRealtimeConnectionChange = useMemo(
    () => () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["me"] }),
        queryClient.invalidateQueries({ queryKey: ["connections"] }),
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        queryClient.invalidateQueries({ queryKey: ["connection-status"] })
      ]);
    },
    [queryClient]
  );

  useRealtimeConnections(data?.id, handleRealtimeConnectionChange);

  useEffect(() => {
    const readStoredCounts = () => ({
      "/rides": Number(window.localStorage.getItem("grove-nav-filter-count:rides") ?? 0) || 0,
      "/housing": Number(window.localStorage.getItem("grove-nav-filter-count:housing") ?? 0) || 0
    });
    const handleFilterCount = (event: Event) => {
      const detail = (event as CustomEvent<{ href?: string; count?: number }>).detail;

      if (!detail?.href) {
        return;
      }

      setNavFilterCounts((current) => ({
        ...current,
        [detail.href!]: Math.max(0, Number(detail.count ?? 0) || 0)
      }));
    };

    setNavFilterCounts(readStoredCounts());
    window.addEventListener("grove-nav-filter-count", handleFilterCount);

    return () => {
      window.removeEventListener("grove-nav-filter-count", handleFilterCount);
    };
  }, []);

  useEffect(() => {
    if (!data?.id) {
      setMarketplaceBadgeCount(0);
      return;
    }

    let cancelled = false;

    apiFetch<{ badgeCount: number }>("/api/marketplace/summary")
      .then((summary) => {
        if (!cancelled) {
          setMarketplaceBadgeCount(summary.badgeCount ?? 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMarketplaceBadgeCount(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [data?.id]);

  return (
    <div
      className="grove-stage relative h-screen overflow-hidden text-cortex-ink dark:text-white"
      data-university-theme={universityTheme.key}
    >
      <div className="grove-noise pointer-events-none absolute inset-0 opacity-[0.09] dark:opacity-[0.12]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-black/10 dark:bg-white/10" />

      <div className="relative h-full overflow-y-auto overflow-x-hidden lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[rgba(var(--campus-primary),0.16)] bg-[#f7eedf]/76 px-6 py-8 backdrop-blur-xl dark:border-[rgba(var(--campus-primary),0.18)] dark:bg-[#14100f]/78 lg:flex lg:flex-col">
          <Link href="/feed" className="flex flex-col items-start gap-5">
            <div className="relative">
              <BrandMark variant="sidebar" className="relative" />
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-[0.34em] text-[rgba(var(--campus-primary),0.82)] dark:text-[rgba(var(--campus-primary),0.9)]">
                Your campus. Your people.
              </div>
              <div className="font-display text-[2.2rem] leading-none">Grove</div>
              <div className="text-[13px] text-black/54 dark:text-white/56">{workspaceLabel}</div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--campus-primary),0.2)] bg-[rgba(var(--campus-primary),0.08)] px-3 py-1 text-[11px] font-semibold text-[rgb(var(--campus-primary))] dark:bg-[rgba(var(--campus-primary),0.12)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--campus-primary))]" />
                {universityTheme.shortName}
              </div>
            </div>
          </Link>

          <nav className="mt-12 space-y-2">
            {navItems.map((item) => (
              (() => {
                const Icon = navIconMap[item.icon as keyof typeof navIconMap] ?? Home;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between rounded-full px-4 py-3 text-sm transition-all duration-300",
                      pathname === item.href
                        ? "bg-[rgb(var(--campus-action))] text-[rgb(var(--campus-on-action))] shadow-[0_16px_32px_rgba(var(--campus-action),0.18)]"
                        : "text-black/66 hover:translate-x-1 hover:bg-white/58 hover:text-cortex-ink dark:text-white/66 dark:hover:bg-white/[0.06] dark:hover:text-white"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "grid h-7 w-7 place-items-center rounded-full border text-center transition",
                          pathname === item.href
                            ? "border-white/12 bg-white/10"
                            : "border-black/8 bg-white/38 group-hover:bg-white/70 dark:border-white/10 dark:bg-white/[0.04]"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.href === "/messages" && unreadCount > 0 ? (
                      <span className="rounded-full bg-cortex-gold/18 px-2 py-0.5 text-[11px] text-cortex-ink dark:bg-cortex-gold/18 dark:text-cortex-parchment">
                        {unreadCount}
                      </span>
                    ) : item.href === "/marketplace" && marketplaceBadgeCount > 0 ? (
                      <span className="rounded-full bg-cortex-gold/18 px-2 py-0.5 text-[11px] text-cortex-ink dark:bg-cortex-gold/18 dark:text-cortex-parchment">
                        {marketplaceBadgeCount}
                      </span>
                    ) : navFilterCounts[item.href] ? (
                      <span className="rounded-full bg-[rgb(var(--campus-action))] px-2 py-0.5 text-[11px] text-[rgb(var(--campus-on-action))]">
                        {navFilterCounts[item.href]}
                      </span>
                    ) : null}
                  </Link>
                );
              })()
            ))}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
            <div className="motion-rise flex items-center justify-between rounded-[28px] border border-[rgba(var(--campus-primary),0.16)] bg-[#fffaf3]/82 px-4 py-4 shadow-[0_18px_40px_rgba(18,17,15,0.07)] backdrop-blur-xl dark:border-[rgba(var(--campus-primary),0.18)] dark:bg-black/26 sm:px-6 lg:px-8">
              <div>
                <div className="text-[11px] uppercase tracking-[0.3em] text-[rgba(var(--campus-primary),0.78)] dark:text-[rgba(var(--campus-primary),0.9)]">
                  {universityTheme.shortName} WORKSPACE
                </div>
                <div className="mt-1 text-sm text-black/58 dark:text-white/62">
                  {isLoading
                    ? "Loading your session..."
                    : `Welcome back, ${data?.name?.split(" ")[0] ?? "there"}`}
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
                <Button variant="ghost" size="sm" className="relative" onClick={() => router.push("/connections")}>
                  <Bell className="h-4 w-4" />
                  {pendingRequestsCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 rounded-full bg-[rgb(var(--campus-action))] px-1.5 py-0.5 text-[10px] leading-none text-[rgb(var(--campus-on-action))]">
                      {pendingRequestsCount}
                    </span>
                  ) : null}
                </Button>
                <div className="hidden sm:block">
                  <Avatar
                    name={data?.name ?? "Grove student"}
                    imageUrl={data?.profilePictureUrl}
                    avatarColor={data?.avatarColor}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await apiFetch("/api/auth/logout", { method: "POST" });
                    router.push("/auth?mode=signin&step=details");
                    router.refresh();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
            <div className="motion-rise mx-auto w-full max-w-[1560px]">{children}</div>
          </main>

          <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
            <div className="rounded-[28px] border border-black/10 bg-[rgba(255,250,243,0.9)] p-1.5 shadow-[0_18px_46px_rgba(18,17,15,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(20,16,15,0.86)]">
              <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {navItems.map((item) => {
                  const Icon = navIconMap[item.icon as keyof typeof navIconMap] ?? Home;
                  const isActive = pathname === item.href;
                  const badgeCount =
                    item.href === "/messages"
                      ? unreadCount
                      : item.href === "/marketplace"
                        ? marketplaceBadgeCount
                        : navFilterCounts[item.href] ?? 0;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "relative flex h-[58px] shrink-0 items-center gap-2 rounded-[22px] px-3.5 text-[12px] font-semibold transition-all duration-300",
                        isActive
                          ? "min-w-[122px] bg-[rgb(var(--campus-action))] text-[rgb(var(--campus-on-action))] shadow-[0_14px_28px_rgba(var(--campus-action),0.24)]"
                          : "min-w-[76px] text-black/60 hover:bg-white/60 hover:text-cortex-ink dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition",
                          isActive
                            ? "border-white/15 bg-white/10"
                            : "border-black/10 bg-[rgba(255,255,255,0.46)] dark:border-white/10 dark:bg-white/5"
                        )}
                      >
                        <Icon className="h-[17px] w-[17px]" strokeWidth={2.2} />
                      </span>
                      <span className={cn("truncate", isActive ? "max-w-[64px]" : "sr-only")}>{item.label}</span>
                      {badgeCount > 0 ? (
                        <span
                          className={cn(
                            "absolute right-2 top-1.5 min-w-4 rounded-full px-1.5 py-0.5 text-center text-[9px] leading-none",
                            isActive
                              ? "bg-white text-[rgb(var(--campus-action))]"
                              : "bg-[rgb(var(--campus-action))] text-[rgb(var(--campus-on-action))]"
                          )}
                        >
                          {badgeCount}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
