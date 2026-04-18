import { quickTips } from "@/lib/constants";

export function QuickTips() {
  return (
    <div className="cortex-panel p-6">
      <div className="eyebrow">Quick Tips</div>
      <div className="mt-4 space-y-3">
        {quickTips.map((tip) => (
          <p key={tip} className="text-sm leading-7 text-black/58 dark:text-white/62">
            {tip}
          </p>
        ))}
      </div>
    </div>
  );
}
