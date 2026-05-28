import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export function LandingFooter() {
  return (
    <footer className="border-t border-black/10 bg-[#f7f0e3] py-10 transition-colors duration-300 dark:border-white/8 dark:bg-[#14100f]">
      <div className="cortex-shell space-y-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark variant="header" className="h-10 w-10" />
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cortex-ink dark:text-[#f7efe3]">GROVE</div>
              <div className="text-xs text-black/52 dark:text-[#bba993]">For every campus</div>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-5 text-sm text-black/60 dark:text-[#c9b8a4]">
            <a href="#why" className="transition hover:text-cortex-ink dark:hover:text-[#f7efe3]">
              Why Grove
            </a>
            <a href="#features" className="transition hover:text-cortex-ink dark:hover:text-[#f7efe3]">
              Features
            </a>
            <a href="#universities" className="transition hover:text-cortex-ink dark:hover:text-[#f7efe3]">
              Universities
            </a>
            <Link href="/auth" className="transition hover:text-cortex-ink dark:hover:text-[#f7efe3]">
              Sign In
            </Link>
          </div>

          <div>
            <Link href="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-black/8 pt-6 text-[12px] text-black/52 dark:border-white/8 dark:text-[#bba993] md:flex-row md:items-center md:justify-between">
          <div>&copy; 2026 Grove. Built for students.</div>
          <div>.edu communities welcome</div>
        </div>
      </div>
    </footer>
  );
}
