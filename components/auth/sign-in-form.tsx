"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { signInSchema } from "@/lib/validators";

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "maya@clarku.edu",
      password: "Password123",
      rememberMe: true
    }
  });

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
      setServerError(error instanceof Error ? error.message : "Unable to sign in");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input placeholder="you@clarku.edu" {...register("email")} />
        {errors.email ? <p className="text-sm text-cortex-ember">{errors.email.message}</p> : null}
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
        <Link href="/verify-email" className="text-cortex-ember">
          Forgot password?
        </Link>
      </div>

      <div className="rounded-[24px] border border-cortex-gold/25 bg-cortex-gold/10 px-4 py-3 text-sm text-black/70 dark:text-white/75">
        Demo credentials are prefilled so you can move straight into the product.
      </div>

      {serverError ? <p className="text-sm text-cortex-ember">{serverError}</p> : null}

      <Button className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}
