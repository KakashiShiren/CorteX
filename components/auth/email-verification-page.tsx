"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export function EmailVerificationPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(30);
  const [message, setMessage] = useState("If your Clark account needs confirmation, check your inbox for the Supabase verification email.");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="cortex-panel max-w-xl p-8 sm:p-10">
      <div className="eyebrow">Verify Email</div>
      <div className="mt-4 text-4xl">Check your Clark inbox</div>
      <p className="mt-4 text-base leading-7 text-black/65 dark:text-white/65">
        Cortex uses your Clark email for account verification. If confirmation is enabled for your project, the resend action below will trigger another verification email.
      </p>
      <div className="mt-6 rounded-[24px] border border-black/10 bg-black/[0.03] p-4 text-sm dark:border-white/10 dark:bg-white/[0.03]">
        {message}
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          disabled={countdown > 0}
          onClick={async () => {
            await apiFetch("/api/auth/verify-email", { method: "POST" });
            setCountdown(30);
            setMessage("Verification email request sent. Check your Clark inbox for the latest link.");
          }}
        >
          {countdown > 0 ? `Resend in ${countdown}s` : "Resend Email"}
        </Button>
        <Button variant="secondary" onClick={() => router.push("/signin")}>
          Back to Sign In
        </Button>
      </div>
    </div>
  );
}
