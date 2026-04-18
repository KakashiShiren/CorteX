import Link from "next/link";

import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="cortex-panel flex flex-col justify-between p-8 sm:p-10">
          <div>
            <div className="eyebrow">Join Cortex</div>
            <div className="mt-5 text-5xl leading-tight">Clark&apos;s utility layer for navigating campus life.</div>
            <p className="mt-6 max-w-xl text-base leading-8 text-black/62 dark:text-white/66">
              Sign up with your Clark email to unlock people search, campus map tools, real-time status, and the AI assistant.
            </p>
          </div>
          <div className="mt-10 space-y-4 text-sm text-black/62 dark:text-white/66">
            <div>Verified student-only network</div>
            <div>Fast search across people, places, and campus answers</div>
            <div>Designed for hackathon demos and real deployment</div>
          </div>
        </section>
        <section className="cortex-panel flex items-center p-8 sm:p-10">
          <div className="w-full">
            <div className="text-3xl">Create your account</div>
            <p className="mt-3 text-sm text-black/56 dark:text-white/58">
              Already have an account?{" "}
              <Link href="/signin" className="text-cortex-ink underline-offset-4 transition hover:underline dark:text-white">
                Sign in
              </Link>
            </p>
            <div className="mt-8">
              <SignUpForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
