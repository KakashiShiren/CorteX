const features = [
  "Verified Clark-only accounts",
  "Real-time status sharing with 24-hour expiration",
  "Campus map with cached building data",
  "Search students by major, year, and residence",
  "AI assistant with citations and RAG-ready data model",
  "Zero vanity mechanics, zero endless feed"
];

export function FeaturesSection() {
  return (
    <section id="features" className="cortex-shell py-24">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <div>
          <div className="eyebrow">Feature Layer</div>
          <div className="mt-4 section-title">Built for campus utility, not distraction.</div>
          <p className="mt-6 max-w-md text-base leading-7 text-black/65 dark:text-white/65">
            Cortex keeps the surface calm and purposeful. Every action is there to help a student decide something or get somewhere.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature} className="border-b border-black/10 pb-5 text-lg dark:border-white/10">
              {feature}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
