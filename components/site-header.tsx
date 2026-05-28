"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { BrandMark } from "@/components/brand-mark";

export function SiteHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";
  const themeIconClassName = "h-[17px] w-[17px]";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="cortex-shell">
        <div
          className={`motion-rise mt-4 flex items-center justify-between gap-6 rounded-full border px-5 py-3 transition-all duration-300 ${
            hasScrolled
              ? "border-black/10 bg-[#fbf5ea]/94 shadow-[0_18px_34px_rgba(18,17,15,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-[#181311]/92 dark:shadow-[0_18px_34px_rgba(0,0,0,0.28)]"
              : "border-black/8 bg-[#fbf5ea]/78 shadow-[0_14px_28px_rgba(18,17,15,0.06)] backdrop-blur-lg dark:border-white/8 dark:bg-[#181311]/74 dark:shadow-[0_14px_28px_rgba(0,0,0,0.22)]"
          }`}
        >
          <Link href="/" className="flex items-center gap-3">
            <BrandMark variant="header" />
          </Link>

          <nav className="hidden items-center gap-4 text-xs font-medium text-[#5f564c] dark:text-[#d9c9b7] min-[520px]:flex lg:gap-8 lg:text-sm">
            <a href="#why" className="transition hover:text-cortex-ink dark:hover:text-[#f7efe3]">
              Why Grove
            </a>
            <a href="#features" className="transition hover:text-cortex-ink dark:hover:text-[#f7efe3]">
              Features
            </a>
            <a href="#how" className="hidden transition hover:text-cortex-ink dark:hover:text-[#f7efe3] lg:inline">
              How it works
            </a>
            <a href="#universities" className="hidden transition hover:text-cortex-ink dark:hover:text-[#f7efe3] lg:inline">
              Universities
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={mounted && isDark ? "Switch to light theme" : "Switch to dark theme"}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/14 bg-[#fffaf3]/96 text-[#3f372f] shadow-[0_12px_24px_rgba(18,17,15,0.07)] transition hover:border-black/18 hover:bg-white dark:border-white/14 dark:bg-white/[0.10] dark:text-[#f7efe3] dark:shadow-none dark:hover:bg-white/[0.18]"
            >
              {mounted ? (
                isDark ? <SunMedium className={themeIconClassName} /> : <MoonStar className={themeIconClassName} />
              ) : (
                <MoonStar className={themeIconClassName} />
              )}
            </button>
            <Link
              href="/auth"
              className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white/58 px-4 text-sm font-medium text-[#4f463d] shadow-[0_10px_22px_rgba(18,17,15,0.04)] transition hover:bg-white/84 dark:border-white/12 dark:bg-white/[0.08] dark:text-[#f7efe3] dark:hover:bg-white/[0.16]"
            >
              Sign In
            </Link>
            <Link
              href="/auth"
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#1C1A17] px-5 text-sm font-semibold text-[#F7F0E3] shadow-[0_14px_30px_rgba(18,17,15,0.16)] transition hover:bg-[#11100e] dark:bg-[#f7efe3] dark:text-[#181311] dark:hover:bg-white"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
