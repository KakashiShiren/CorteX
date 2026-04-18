const testimonials = [
  {
    quote: "It feels like the one app that actually understands what a campus day looks like.",
    author: "CS Student, Junior"
  },
  {
    quote: "The status layer makes it way easier to find people without blasting group chats.",
    author: "Biology Student, Sophomore"
  },
  {
    quote: "I asked where the gym was, saw the hours, and started walking in one flow.",
    author: "First-Year Student"
  }
];

export function TestimonialSection() {
  return (
    <section className="bg-cortex-garnet py-24 text-white">
      <div className="cortex-shell">
        <div className="eyebrow text-cortex-gold">Student Voice</div>
        <div className="mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl">
          Designed to feel like campus support, not campus noise.
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {testimonials.map((item) => (
            <div key={item.author} className="border-t border-white/15 pt-6">
              <p className="text-lg leading-8 text-white/85">“{item.quote}”</p>
              <div className="mt-4 text-sm uppercase tracking-[0.18em] text-cortex-gold/80">{item.author}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
