const items = [
  {
    title: "Navigation",
    problem: "New students lose time figuring out where to go next.",
    solution: "Search a Clark building and get the route immediately."
  },
  {
    title: "Connection",
    problem: "It is hard to know who is available, nearby, or in the same major.",
    solution: "Browse verified students and see real-time status context."
  },
  {
    title: "Intelligence",
    problem: "Campus answers are scattered across pages, PDFs, and people.",
    solution: "Ask one assistant that cites Clark-specific information."
  }
];

export function ProblemsSection() {
  return (
    <section className="cortex-shell py-24">
      <div className="eyebrow">Problems Cortex Solves</div>
      <div className="mt-4 section-title">Three campus bottlenecks. One fast answer layer.</div>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="border-t border-black/10 pt-6 dark:border-white/10">
            <div className="text-2xl font-semibold">{item.title}</div>
            <p className="mt-4 text-base leading-7 text-black/65 dark:text-white/65">{item.problem}</p>
            <p className="mt-4 text-sm font-medium text-cortex-garnet dark:text-cortex-gold">
              {item.solution}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
