"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { GroveWordmark } from "@/components/auth/grove-wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { emailVerificationSchema } from "@/lib/validators";

type ForgotPasswordValues = z.infer<typeof emailVerificationSchema>;

export default function ForgotPasswordPage() {
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(emailVerificationSchema),
    mode: "onBlur",
    defaultValues: {
      email: ""
    }
  });

  async function onSubmit(values: ForgotPasswordValues) {
    try {
      setServerError(null);
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        throw new Error("Supabase is not configured for password reset.");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(values.email);

      if (error) {
        throw error;
      }

      setSuccessEmail(values.email.toLowerCase());
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to send a reset link.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f6efe2] px-5 py-8 text-[#1C1A17] md:px-12 md:py-16">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[430px] flex-col md:justify-center">
        <div className="mb-10 flex justify-center md:justify-start">
          <GroveWordmark tone="dark" compact />
        </div>

        <Link
          href="/auth?mode=signin&step=details"
          className="inline-flex items-center gap-2 text-[11px] font-medium text-black/48 transition hover:text-[#1C1A17]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to sign in</span>
        </Link>

        <div className="mt-8">
          <h1 className="font-display text-[28px] leading-[1.1] text-[#1C1A17]">Reset your password</h1>
          <p className="mt-3 text-[13px] leading-[1.6] text-black/58">
            Enter your .edu email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {successEmail ? (
          <div className="mt-8 space-y-4">
            <p className="text-[14px] leading-[1.7] text-black/58">
              Check your inbox for a reset link{successEmail ? ` sent to ${successEmail}` : ""}.
            </p>
            <Link
              href="/auth?mode=signin&step=details"
              className="inline-flex items-center gap-2 text-sm font-medium text-black/58 transition hover:text-[#1C1A17]"
            >
              <span>Back to sign in</span>
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
            </Link>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1C1A17]">Email</label>
              <Input placeholder="your@university.edu" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-sm text-cortex-ember">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            {serverError ? <p className="text-sm text-cortex-ember">{serverError}</p> : null}

            <Button className="w-full" size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Sending reset link..." : "Send reset link"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
