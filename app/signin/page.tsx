import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage({
  searchParams
}: {
  searchParams: { redirectTo?: string };
}) {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="cortex-panel flex flex-col justify-between p-8 sm:p-10">
          <div>
            <div className="eyebrow">Welcome Back</div>
            <div className="mt-5 text-5xl leading-tight">Move through campus with less friction.</div>
            <p className="mt-6 max-w-xl text-base leading-8 text-black/62 dark:text-white/66">
              Sign in to continue with people search, live status, messaging, campus navigation, and the Clark-specific AI assistant.
            </p>
          </div>
          <div className="mt-10 rounded-[24px] border border-black/6 bg-black/[0.02] p-6 dark:border-white/8 dark:bg-white/[0.03]">
            <div className="text-[11px] uppercase tracking-[0.28em] text-black/44 dark:text-white/42">What&apos;s inside</div>
            <div className="mt-4 space-y-3 text-sm text-black/62 dark:text-white/66">
              <div>Search by major, year, residence, or status</div>
              <div>Find buildings and get directions instantly</div>
              <div>Ask for hours, facilities, and quick campus facts</div>
            </div>
          </div>
        </section>
        <section className="cortex-panel flex items-center p-8 sm:p-10">
          <div className="w-full">
            <div className="text-3xl">Sign in</div>
            <p className="mt-3 text-sm text-black/56 dark:text-white/58">
              Need an account?{" "}
              <Link href="/signup" className="text-cortex-ink underline-offset-4 transition hover:underline dark:text-white">
                Create one
              </Link>
            </p>
            <div className="mt-8">
              <SignInForm redirectTo={searchParams.redirectTo} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
