import { redirect } from "next/navigation";

import { GroveWordmark } from "@/components/auth/grove-wordmark";
import { UnifiedAuthFlow } from "@/components/auth/unified-auth-flow";
import { getSession } from "@/lib/auth";

export default function AuthPage({
  searchParams
}: {
  searchParams?: {
    redirectTo?: string;
    mode?: string;
    step?: string;
  };
}) {
  const session = getSession();

  if (session?.isVerified) {
    redirect("/feed");
  }

  const initialMode = searchParams?.mode === "signin" ? "signin" : "signup";
  const initialStep = searchParams?.step === "details" || searchParams?.mode === "signin" ? 2 : 1;

  return (
    <main className="min-h-screen bg-[#f6efe2] text-[#1C1A17] md:grid md:grid-cols-[45fr_55fr]">
      <section className="hidden min-h-screen flex-col bg-[#1C1A17] px-12 py-16 text-[#F7F0E3] md:flex">
        <div className="flex flex-1 flex-col justify-center">
          <GroveWordmark tone="light" />
          <h1 className="mt-10 max-w-md font-display text-[42px] leading-[1.2] text-[#F7F0E3]">
            Your campus,
            <br />
            your people.
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-[1.7] text-[#d6c7b3]">
            Grove is the verified student social platform. Post events, find your people, and get instant campus
            answers - all verified by your .edu email.
          </p>
          <div className="mt-8 space-y-3 text-[12px] text-[#c8b7a0]">
            {[
              "Verified students only - no fake accounts",
              "Your university's community, isolated and private",
              "Campus AI, events, people - all in one place"
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c8b7a0]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-[#988875]">Built for Clark, Northeastern, WPI, and Boston University.</p>
      </section>

      <section className="min-h-screen bg-[#f6efe2] px-5 py-8 md:px-12 md:py-16">
        <UnifiedAuthFlow
          redirectTo={searchParams?.redirectTo ?? "/feed"}
          initialMode={initialMode}
          initialStep={initialStep as 1 | 2}
        />
      </section>
    </main>
  );
}
