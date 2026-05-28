import Link from "next/link";

const universities = [
  "State universities",
  "Private colleges",
  "Community colleges",
  "Art schools",
  "Tech institutes"
];

export function UniversitiesSection() {
  return (
    <section id="universities" className="bg-[#f4ecde] py-24 transition-colors duration-300 dark:bg-[#120f0e] sm:py-28">
      <div className="cortex-shell">
        <div className="mx-auto max-w-3xl text-center">
          <div className="eyebrow dark:text-[#bda98f]">Where Grove Works</div>
          <div className="mt-4 font-display text-5xl leading-[1.05] text-[#161410] dark:text-[#f7efe3] sm:text-6xl">
            Built for students.
            <br />
            Built for every campus.
          </div>
          <p className="mt-6 text-[15px] leading-7 text-[#554d45] dark:text-[#c8b8a7]">
            Every .edu domain is supported - the moment the first student from your university signs up, your campus
            community starts.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {universities.map((name) => (
            <div
              key={name}
              className="rounded-full border border-black/8 bg-white/78 px-4 py-2 text-sm font-medium text-[#534b43] shadow-[0_10px_24px_rgba(18,17,15,0.05)] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#e3d5c4] dark:shadow-none"
            >
              {name}
            </div>
          ))}
          <Link
            href="/auth"
            className="rounded-full border border-[#1C1A17] bg-[#1C1A17] px-5 py-2.5 text-sm font-semibold text-[#F7F0E3] shadow-[0_12px_24px_rgba(18,17,15,0.10)] dark:border-[#f7efe3] dark:bg-[#f7efe3] dark:text-[#181311] dark:shadow-none"
          >
            + Your university -&gt;
          </Link>
        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-[32px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,251,246,0.94),rgba(248,241,230,0.98))] px-8 py-8 text-center shadow-[0_20px_40px_rgba(18,17,15,0.07)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(28,24,22,0.96),rgba(20,17,15,0.98))] dark:shadow-[0_20px_40px_rgba(0,0,0,0.24)]">
          <div className="font-display text-[30px] leading-tight text-cortex-ink dark:text-[#f7efe3]">
            Your university community grows itself.
          </div>
          <p className="mt-3 text-[14px] leading-7 text-[#554d45] dark:text-[#c8b8a7]">
            One student joins. Then a few friends. Then the feed starts to move. No setup required.
          </p>
        </div>
      </div>
    </section>
  );
}
