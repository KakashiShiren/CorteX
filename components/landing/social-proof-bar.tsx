const stats = [
  {
    value: "247 students",
    label: "Verified members"
  },
  {
    value: "89 events",
    label: "Posted this month"
  },
  {
    value: "1,240 connections",
    label: "Made on Grove"
  }
];

export function SocialProofBar() {
  return (
    <section
      id="why"
      className="border-y border-black/8 bg-[#efe5d5] py-5 transition-colors duration-300 dark:border-white/8 dark:bg-[#171311]"
    >
      <div className="cortex-shell">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
          <div className="text-sm font-medium text-cortex-ink dark:text-[#f1e7d8]">Grove is built for every campus</div>
          <div className="grid w-full gap-5 sm:grid-cols-3 lg:w-auto lg:gap-0">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`px-4 text-center ${index > 0 ? "sm:border-l sm:border-black/8 dark:sm:border-white/8" : ""}`}
              >
                <div className="font-display text-[24px] font-semibold text-cortex-ink dark:text-[#f7efe3]">
                  {stat.value}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-black/48 dark:text-[#bba993]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
