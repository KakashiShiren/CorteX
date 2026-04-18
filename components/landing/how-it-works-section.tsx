const steps = [
  {
    step: "1",
    title: "Sign in with Clark",
    body: "Verified student access keeps the network useful and trusted."
  },
  {
    step: "2",
    title: "Search or ask",
    body: "Jump into people, places, or AI from one unified front door."
  },
  {
    step: "3",
    title: "Take action immediately",
    body: "Get a direction, send a message, or meet someone where they already are."
  }
];

export function HowItWorksSection() {
  return (
    <section id="workflow" className="bg-cortex-ink py-24 text-cortex-parchment">
      <div className="cortex-shell">
        <div className="eyebrow text-cortex-gold">How It Works</div>
        <div className="mt-4 max-w-4xl text-4xl leading-tight sm:text-5xl">
          Confused student. Open Cortex. Get grounded. Move.
        </div>
        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="rounded-[28px] border border-white/10 bg-white/5 p-7">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-cortex-gold/80">
                Step {item.step}
              </div>
              <div className="mt-4 text-2xl font-semibold">{item.title}</div>
              <p className="mt-3 text-sm leading-7 text-white/70">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
