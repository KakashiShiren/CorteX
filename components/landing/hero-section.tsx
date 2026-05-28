import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export function HeroSection() {
  const previewPosts = [
    {
      accent: "#8B6914",
      badge: "Event",
      title: "Open mic at Higgins tonight",
      stat: "24 going"
    },
    {
      accent: "#1E5A3A",
      badge: "Trip / Hike",
      title: "Blue Hills sunrise carpool",
      stat: "11 going"
    },
    {
      accent: "#7C3454",
      badge: "Party",
      title: "Basement set after formal",
      stat: "32 going"
    }
  ];

  return (
    <section className="grove-stage relative min-h-screen overflow-hidden pt-28 text-cortex-ink transition-colors duration-300 dark:text-[#f7efe3]">
      <div className="grove-noise pointer-events-none absolute inset-0 opacity-[0.08] dark:opacity-[0.12]" />
      <div className="cortex-shell relative flex min-h-[calc(100vh-7rem)] flex-col justify-center py-14 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
          <div className="motion-rise max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-black/10 bg-[#fffaf3]/92 px-4 py-2 text-xs font-medium text-[#5d544b] shadow-[0_14px_30px_rgba(18,17,15,0.06)] dark:border-white/10 dark:bg-white/[0.08] dark:text-[#decdb8] dark:shadow-none">
              &#x1F33F; Verified students only &middot; Zero spam &middot; Zero bots
            </div>
            <div className="mt-7">
              <BrandMark variant="sidebar" className="scale-110 origin-left" />
            </div>
            <h1 className="mt-6 font-display text-4xl leading-none text-[#6c1420] dark:text-[#d5b672] sm:text-5xl">
              Your campus, finally connected.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-[1.7] text-[#413930] dark:text-[#d8cbb8]">
              Grove is the verified student social platform where every person is a real student from your
              university. Post events, find your people, and get instant campus answers - all in one place.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/auth"
                className="inline-flex h-14 items-center justify-center rounded-full bg-[#1C1A17] px-10 text-[17px] font-semibold text-[#F7F0E3] shadow-[0_18px_38px_rgba(18,17,15,0.16)] transition hover:bg-[#12110f] dark:bg-[#f7efe3] dark:text-[#181311] dark:shadow-[0_18px_38px_rgba(0,0,0,0.24)] dark:hover:bg-white"
              >
                Get Started Free
              </Link>
              <a
                href="#how"
                className="inline-flex h-14 items-center justify-center rounded-full border border-black/12 bg-[#fffaf3]/92 px-10 text-[17px] font-semibold text-[#3e362f] shadow-[0_14px_30px_rgba(18,17,15,0.07)] transition hover:bg-white dark:border-white/12 dark:bg-white/[0.08] dark:text-[#f7efe3] dark:shadow-none dark:hover:bg-white/[0.14]"
              >
                See how it works
              </a>
            </div>
            <div className="mt-5 text-[12px] text-[#5d544b] dark:text-[#c9b8a4]">
              Built for students everywhere &middot; .edu emails supported &middot; Free to join
            </div>
          </div>

          <div className="motion-rise relative">
            <div className="grove-feed-preview hover-lift relative mx-auto w-full max-w-[520px] rounded-[24px] border border-[#2f2923] bg-[#1C1A17] p-6 text-[#F7F0E3] shadow-[0_30px_68px_rgba(18,17,15,0.16)] dark:border-white/10 dark:shadow-[0_30px_68px_rgba(0,0,0,0.30)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b9aa94]">GROVE FEED</div>
              <div className="mt-5 space-y-3">
                {previewPosts.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[14px] border border-white/10 bg-white/[0.05] px-4 py-3 transition duration-300 hover:translate-x-1 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.accent }} />
                      <div className="rounded-full border border-white/10 bg-white/[0.07] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#d7c7b0]">
                        {item.badge}
                      </div>
                    </div>
                    <div className="mt-3 text-sm font-medium text-[#f7efe3]">{item.title}</div>
                    <div className="mt-2 text-[11px] text-[#b9aa94]">{item.stat}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 inline-flex items-center rounded-full border border-[#28563d] bg-[#1f3e2e] px-3 py-1.5 text-[11px] font-medium text-[#d9f0df]">
                &#x1F33F; 11 students active right now
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
