import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export function ComingSoonPage({
  eyebrow,
  title,
  description,
  preview
}: {
  eyebrow: string;
  title: string;
  description: string;
  preview?: React.ReactNode;
}) {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="mt-3 text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-black/56 dark:text-white/58">
            {description}
          </p>
        </div>

        <div className="cortex-panel overflow-hidden p-8 sm:p-10">
          <div className={preview ? "grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]" : ""}>
            {preview ? <div>{preview}</div> : null}
            <div className="rounded-[24px] border border-dashed border-black/10 bg-black/[0.02] p-8 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="eyebrow">Coming Soon</div>
              <div className="mt-4 font-display text-3xl">This demo route is intentionally parked for now.</div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-black/56 dark:text-white/58">
                The navigation stays in place so demos keep their full structure, but this screen now fails gracefully while the live experience is still being finished.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/ai-chat">
                  <Button>Try AI Campus Assistant</Button>
                </Link>
                <Link href="/find-people">
                  <Button variant="secondary">Open Find People</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
