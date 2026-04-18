const useCases = [
  {
    title: "Freshmen",
    body: "Learn where everything is and who is around before campus starts feeling overwhelming."
  },
  {
    title: "Commuters",
    body: "Arrive with purpose, see where classmates are, and move through campus with less friction."
  },
  {
    title: "Study Groups",
    body: "Match status, location, and messaging to turn loose plans into actual meetups."
  },
  {
    title: "Campus Explorers",
    body: "Find facilities, hours, and hidden useful spaces without hunting through multiple sites."
  }
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="cortex-shell py-24">
      <div className="eyebrow">Use Cases</div>
      <div className="mt-4 section-title">Useful from the first day on campus to the last late-night study sprint.</div>
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {useCases.map((item) => (
          <div key={item.title} className="cortex-panel p-8">
            <div className="text-2xl font-semibold">{item.title}</div>
            <p className="mt-4 text-base leading-7 text-black/65 dark:text-white/65">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
