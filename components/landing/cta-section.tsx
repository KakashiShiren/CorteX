import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="cortex-shell py-24">
      <div className="cortex-panel overflow-hidden px-8 py-12 sm:px-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="eyebrow">Ready To Launch</div>
            <div className="mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl">
              Ready to connect your campus with one calmer, smarter surface?
            </div>
            <p className="mt-5 max-w-2xl text-base leading-7 text-black/65 dark:text-white/65">
              Start the MVP, plug in live Clark data, and turn the hackathon prototype into a real student utility platform.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link href="/signup">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/signin">
              <Button size="lg" variant="secondary">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
