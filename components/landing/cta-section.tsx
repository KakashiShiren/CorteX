import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="bg-[#1C1A17] px-10 py-20 text-center text-cortex-parchment">
      <div className="cortex-shell">
        <div className="mx-auto max-w-3xl">
          <div className="font-display text-5xl leading-[1.02] sm:text-6xl">Your campus is waiting.</div>
          <p className="mt-5 text-[16px] leading-7 text-[#d8cbb8]">
            Join Grove free with your .edu email. No waitlist, no approval, no nonsense.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/auth">
              <Button
                variant="outline"
                size="lg"
                className="border-white/18 bg-transparent text-[#f7efe3] hover:bg-white/[0.06]"
              >
                Sign In
              </Button>
            </Link>
          </div>
          <div className="mt-5 text-[11px] text-[#a6947c]">Grove is free for students. Always.</div>
        </div>
      </div>
    </section>
  );
}
