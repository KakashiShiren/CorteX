const steps = [
  {
    step: "01",
    title: "Sign in with your .edu email",
    body: "Your university email is your identity. No approval process, no waitlist. Verified instantly."
  },
  {
    step: "02",
    title: "Set your status, explore the feed",
    body: "Tell your campus what you're up to. Browse events, find study partners, discover what's happening around you."
  },
  {
    step: "03",
    title: "Connect, ask, navigate",
    body: "Message classmates, ask the AI assistant campus questions, and find any building in seconds."
  }
];

export function HowItWorksSection() {
  return (
    <section id="how" className="bg-[#1C1A17] py-24 text-cortex-parchment sm:py-28">
      <div className="cortex-shell">
        <div className="eyebrow text-cortex-gold">How It Works</div>
        <div className="mt-4 max-w-4xl text-4xl leading-tight sm:text-5xl">
          Confused student. Open Grove. Get grounded. Move.
        </div>
        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="rounded-[28px] border border-white/10 bg-[#2A2520] p-7">
              <div className="font-display text-[36px] leading-none text-[#ccb89a]">{item.step}</div>
              <div className="mt-6 text-[15px] font-semibold text-[#f7efe3]">{item.title}</div>
              <p className="mt-3 text-[13px] leading-[1.65] text-[#d8cbb8]">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
