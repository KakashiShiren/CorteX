import Link from "next/link";
import { Compass, MessagesSquare, Sparkles, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-cortex-parchment pt-28 text-cortex-ink dark:bg-[#110d0d] dark:text-white">
      <div className="absolute inset-0 bg-mesh-radial" />
      <div className="absolute inset-0 subtle-grid opacity-30" />
      <div className="cortex-shell relative flex min-h-[calc(100vh-7rem)] flex-col justify-center py-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <div className="max-w-2xl">
            <Badge className="mb-6">Hackathon MVP for Clark University</Badge>
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-cortex-garnet/70 dark:text-cortex-gold">
              The Brain of Campus
            </div>
            <h1 className="mt-4 max-w-3xl text-[clamp(3.5rem,9vw,7rem)] leading-[0.92]">Cortex</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-black/70 dark:text-white/70">
              Find your building, find your people, and get trusted Clark answers in under ten seconds.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <a href="#workflow">
                <Button variant="secondary" size="lg">
                  See How It Works
                </Button>
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-3 text-sm text-black/60 dark:text-white/60">
              <span>Verified students only</span>
              <span>•</span>
              <span>Zero algorithmic feed</span>
              <span>•</span>
              <span>AI answers with citations</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-10 hidden h-32 w-32 rounded-full bg-cortex-gold/30 blur-3xl lg:block" />
            <div className="absolute -right-10 bottom-6 hidden h-48 w-48 rounded-full bg-cortex-ember/25 blur-3xl lg:block" />
            <div className="cortex-panel relative overflow-hidden p-5 sm:p-7">
              <div className="rounded-[24px] bg-cortex-ink px-5 py-4 text-cortex-parchment">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-cortex-gold/70">Live Cortex</div>
                    <div className="mt-2 text-2xl font-semibold">Solve campus friction fast</div>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[22px] bg-white/6 p-4">
                    <Compass className="h-5 w-5 text-cortex-gold" />
                    <div className="mt-4 text-lg font-semibold">Motor Cortex</div>
                    <p className="mt-2 text-sm text-white/70">
                      Search a building and jump straight into walking directions.
                    </p>
                  </div>
                  <div className="rounded-[22px] bg-white/6 p-4">
                    <UsersRound className="h-5 w-5 text-cortex-gold" />
                    <div className="mt-4 text-lg font-semibold">Social Cortex</div>
                    <p className="mt-2 text-sm text-white/70">
                      Find verified Clark students by name, major, year, or real-time status.
                    </p>
                  </div>
                  <div className="rounded-[22px] bg-white/6 p-4">
                    <Sparkles className="h-5 w-5 text-cortex-gold" />
                    <div className="mt-4 text-lg font-semibold">Sensory Cortex</div>
                    <p className="mt-2 text-sm text-white/70">
                      Ask where, when, or how and get an answer grounded in campus data.
                    </p>
                  </div>
                  <div className="rounded-[22px] bg-cortex-ember p-4 text-white shadow-glow">
                    <MessagesSquare className="h-5 w-5 text-cortex-gold" />
                    <div className="mt-4 text-lg font-semibold">Status-first campus network</div>
                    <p className="mt-2 text-sm text-white/80">
                      See what classmates are doing right now, not a vanity feed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
