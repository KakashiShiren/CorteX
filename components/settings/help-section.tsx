import { faqItems } from "@/lib/constants";

export function HelpSection() {
  return (
    <div className="cortex-panel p-6 sm:p-8">
      <div className="eyebrow">Help</div>
      <div className="mt-3 text-3xl">FAQ and support</div>
      <div className="mt-6 space-y-4">
        {faqItems.map((item) => (
          <div key={item.question} className="rounded-[24px] border border-black/10 p-5 dark:border-white/10">
            <div className="text-lg font-semibold">{item.question}</div>
            <p className="mt-3 text-sm leading-7 text-black/65 dark:text-white/65">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
