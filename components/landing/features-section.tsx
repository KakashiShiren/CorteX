import { Grid2x2, ShieldCheck, Sparkles, UsersRound } from "lucide-react";

const features = [
  {
    icon: Grid2x2,
    title: "Campus feed, not a social feed",
    body: "Post events, trips, parties, shoutouts, and lost items. Everything expires or gets archived - no endless scroll, no algorithmic noise. Just what's happening at your university right now.",
    accent: "#8B6914"
  },
  {
    icon: ShieldCheck,
    title: "Every person is a real student",
    body: "Sign up with your .edu email. That's it. No fake accounts, no randos, no spam. Grove is exclusively for verified students at your university.",
    accent: "#1E5A3A"
  },
  {
    icon: Sparkles,
    title: "Ask anything about your campus",
    body: "Library hours, building locations, gym schedule, study room bookings - the AI assistant knows your campus and cites its sources. No more Googling through 10 different pages.",
    accent: "#1A4A6B"
  },
  {
    icon: UsersRound,
    title: "See who's around right now",
    body: "Students set a live status - studying at the library, free to hang, eating at HUC. Find your people, join a study session, or just know campus isn't empty on a Sunday.",
    accent: "#4A2A7C"
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[#f7f0e3] py-24 transition-colors duration-300 dark:bg-[#171311] sm:py-28">
      <div className="cortex-shell">
        <div className="max-w-3xl">
          <div className="eyebrow dark:text-[#bda98f]">What Grove Does</div>
          <div className="mt-4 section-title dark:text-[#f7efe3]">
            Everything campus life needs.
            <br />
            Nothing it doesn&apos;t.
          </div>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-black/62 dark:text-[#cab9a7]">
            Grove keeps the surface calm and useful. Every section exists to help students find what&apos;s happening,
            locate people, and move through campus with less friction.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-[28px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,250,244,0.94),rgba(248,241,230,0.98))] p-6 shadow-[0_18px_34px_rgba(18,17,15,0.06)] transition hover:border-black/12 hover:bg-[linear-gradient(180deg,rgba(255,252,248,1),rgba(248,241,230,1))] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(28,24,22,0.96),rgba(20,17,15,0.98))] dark:shadow-[0_20px_40px_rgba(0,0,0,0.24)] dark:hover:border-white/16"
              >
                <div className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: feature.accent }} />
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] border border-black/8 bg-white/72 text-[#4e463d] dark:border-white/10 dark:bg-white/[0.05] dark:text-[#e6d8c7]">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mt-6 font-display text-[19px] font-semibold leading-6 text-[#171512] dark:text-[#f7efe3]">
                  {feature.title}
                </div>
                <p className="mt-3 max-w-md text-[13px] leading-[1.75] text-[#554d45] dark:text-[#c8b8a7]">
                  {feature.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}