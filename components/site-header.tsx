"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import cortexLogo from "@/Cortex.png";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="cortex-shell">
        <div className="mt-4 flex items-center justify-between rounded-full border border-black/6 bg-white/76 px-4 py-3 shadow-[0_18px_40px_rgba(18,17,15,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-cortex-gold/10 blur-2xl" />
              <Image
                src={cortexLogo}
                alt="Cortex logo"
                priority
                className="relative h-auto w-[42px] object-contain drop-shadow-[0_10px_18px_rgba(18,17,15,0.12)] dark:drop-shadow-[0_12px_20px_rgba(0,0,0,0.3)]"
              />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-cortex-ink/72 dark:text-white/72">
                Cortex
              </div>
              <div className="text-xs text-black/55 dark:text-white/55">Clark University</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-black/70 dark:text-white/70 md:flex">
            <a href="#features" className="transition hover:text-cortex-ink dark:hover:text-white">
              Features
            </a>
            <a href="#workflow" className="transition hover:text-cortex-ink dark:hover:text-white">
              How It Works
            </a>
            <a href="#use-cases" className="transition hover:text-cortex-ink dark:hover:text-white">
              Use Cases
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              aria-label={mounted && isDark ? "Switch to light theme" : "Switch to dark theme"}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-9 rounded-full border border-black/8 bg-white/52 px-0 text-cortex-ink shadow-[0_10px_24px_rgba(18,17,15,0.06)] hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.12]"
            >
              {mounted ? (
                isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />
              ) : (
                <span className="h-4 w-4" />
              )}
            </Button>
            <Link href="/signin">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
