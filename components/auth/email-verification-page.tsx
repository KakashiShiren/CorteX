"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { formatUniversityName } from "@/lib/university";

const verificationErrorMessages: Record<string, string> = {
  configuration: "Grove could not finish sending the verification code. Please try again in a moment.",
  "invalid-link": "That verification request is expired or invalid. Request a new verification code below.",
  "missing-token": "That verification request is incomplete. Request a new verification code below.",
  "missing-account": "We couldn't match that verification attempt to a Grove signup.",
  "invalid-domain": "Only university email addresses can activate Grove.",
  "not-confirmed": "That university email still needs to be confirmed. Request a new confirmation email below.",
  "profile-sync": "Your email was verified, but Grove could not finish activating your profile. Try requesting a fresh verification code."
};

function inferUniversityName(email?: string) {
  const domain = email?.split("@")[1]?.trim().toLowerCase();

  if (!domain) {
    return "Your campus";
  }

  if (domain === "clarku.edu") {
    return "Clark University";
  }

  return formatUniversityName(domain);
}

function getInitialMessage(email?: string, error?: string) {
  if (error) {
    return verificationErrorMessages[error] ?? "We couldn't finish verifying your university email. Try requesting a fresh confirmation email.";
  }

  if (email) {
    return `We sent a 6-digit verification code to ${email}. Enter it here to activate your Grove account. The code expires in 10 minutes.`;
  }

  return "We sent a 6-digit verification code to your university email. Enter it here to activate your Grove account. The code expires in 10 minutes.";
}

export function EmailVerificationPage({
  email,
  error,
  universityName
}: {
  email?: string;
  error?: string;
  universityName?: string;
}) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(error ? 0 : 60);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [message, setMessage] = useState(getInitialMessage(email, error));
  const [code, setCode] = useState("");

  const campusName = universityName?.trim() || inferUniversityName(email);

  useEffect(() => {
    setMessage(getInitialMessage(email, error));
    setCountdown(error ? 0 : 60);
  }, [email, error]);

  useEffect(() => {
    if (countdown === 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (!email) {
      return;
    }

    try {
      setIsResending(true);
      const response = await apiFetch<{ message?: string }>("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setCountdown(60);
      setMessage(response.message ?? `We sent another verification code to ${email}.`);
    } catch (resendError) {
      setMessage(resendError instanceof Error ? resendError.message : "Unable to resend the verification code.");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email) {
      setMessage("Sign up or sign in first so Grove knows which university inbox should receive the code.");
      return;
    }

    try {
      setIsVerifying(true);
      await apiFetch("/api/auth/verify-email", {
        method: "PUT",
        body: JSON.stringify({ email, code })
      });
      router.replace("/feed");
      router.refresh();
    } catch (verificationError) {
      setMessage(verificationError instanceof Error ? verificationError.message : "Unable to verify that code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackToSignIn = async () => {
    try {
      setIsLeaving(true);
      await apiFetch("/api/auth/logout", {
        method: "POST"
      });
    } catch {
      // Even if logout fails, still navigate away so the user is not trapped here.
    } finally {
      router.replace("/auth?mode=signin&step=details");
      router.refresh();
    }
  };

  return (
    <div className="cortex-panel max-w-xl p-8 sm:p-10">
      <div className="eyebrow">Confirm Signup</div>
      <div className="mt-4 text-4xl">Check your university inbox</div>
      <p className="mt-4 text-base leading-7 text-black/65 dark:text-white/65">
        We sent a 6-digit verification code to {email ?? "your university email"}. Enter it below to activate your
        Grove account.
      </p>
      <div className="mt-6 rounded-[24px] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="font-display text-[1.6rem] leading-tight text-cortex-ink dark:text-cortex-parchment">
          Welcome to Grove at {campusName}!
        </div>
        <p className="mt-3 text-sm leading-7 text-black/62 dark:text-white/62">{message}</p>
      </div>
      <form onSubmit={handleVerify} className="mt-8 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-cortex-ink dark:text-cortex-parchment">
            Verification code
          </label>
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center text-2xl tracking-[0.35em]"
          />
        </div>
        <Button type="submit" className="w-full" disabled={!email || code.length !== 6 || isVerifying}>
          {isVerifying ? "Verifying..." : "Verify Email"}
        </Button>
      </form>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          disabled={Boolean(!email || countdown > 0 || isResending)}
          onClick={handleResend}
        >
          {isResending
            ? "Sending..."
            : countdown > 0
              ? `Resend code in ${countdown}s`
              : "Resend code"}
        </Button>
        <Button type="button" variant="secondary" disabled={isLeaving} onClick={() => void handleBackToSignIn()}>
          {isLeaving ? "Leaving..." : "Back to Sign In"}
        </Button>
      </div>
      {!email ? (
        <p className="mt-4 text-sm text-black/58 dark:text-white/60">
          Sign up or sign in first so Grove knows which university inbox should receive the verification code.
        </p>
      ) : null}
    </div>
  );
}
