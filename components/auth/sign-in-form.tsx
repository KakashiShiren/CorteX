"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUniversityDetection } from "@/hooks/use-university-detection";
import { ApiError, apiFetch } from "@/lib/api";
import { signInSchema } from "@/lib/validators";

type SignInValues = z.infer<typeof signInSchema>;
type VerificationResponse = {
  verificationRequired?: boolean;
  email?: string;
  universityName?: string;
  resendFailed?: boolean;
};

export function SignInForm({ redirectTo = "/feed" }: { redirectTo?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true
    }
  });

  const email = watch("email");
  const universityDetection = useUniversityDetection(email);
  const detectedUniversityName = universityDetection.visible ? universityDetection.name : undefined;

  const redirectToVerification = (verificationEmail: string, universityName?: string) => {
    const params = new URLSearchParams({
      email: verificationEmail.toLowerCase()
    });

    if (universityName) {
      params.set("universityName", universityName);
    }

    router.push(`/verify-email?${params.toString()}`);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      setServerError(null);
      await apiFetch("/api/auth/signin", {
        method: "POST",
        body: JSON.stringify(values)
      });
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        const details = error.data as VerificationResponse | undefined;
        if (details?.verificationRequired && !details.resendFailed) {
          redirectToVerification(details.email ?? values.email, details.universityName ?? detectedUniversityName);
          return;
        }
      }

      setServerError(error instanceof Error ? error.message : "Unable to sign in");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input placeholder="your@university.edu" {...register("email")} />
        {errors.email ? <p className="text-sm text-cortex-ember">{errors.email.message}</p> : null}
        {!errors.email ? (
          <p className="text-xs text-black/48 dark:text-white/52">Sign in with your university email</p>
        ) : null}
        {universityDetection.visible && !universityDetection.loading ? (
          <p className="text-xs text-black/52 transition-opacity duration-200 dark:text-white/56">
            Signing into {universityDetection.name}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <Input type="password" placeholder="Password123" {...register("password")} />
        {errors.password ? <p className="text-sm text-cortex-ember">{errors.password.message}</p> : null}
      </div>
      <div className="flex items-center justify-between text-sm text-black/60 dark:text-white/60">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="rounded" {...register("rememberMe")} />
          Remember me
        </label>
        <Link
          href={email ? `/verify-email?email=${encodeURIComponent(email.toLowerCase())}` : "/verify-email"}
          className="text-cortex-ember"
        >
          Need a new verification code?
        </Link>
      </div>

      <div className="rounded-[24px] border border-cortex-gold/25 bg-cortex-gold/10 px-4 py-3 text-sm text-black/70 dark:text-white/75">
        Sign in with your university email.
      </div>

      {serverError ? <p className="text-sm text-cortex-ember">{serverError}</p> : null}

      <Button className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}
