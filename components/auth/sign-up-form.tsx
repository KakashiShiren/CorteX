"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { signUpSchema } from "@/lib/validators";

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
      clarkId: ""
    }
  });

  const password = watch("password");
  const passwordStrength =
    Number(password.length >= 8) + Number(/[A-Z]/.test(password)) + Number(/[0-9]/.test(password));

  const onSubmit = handleSubmit(async (values) => {
    try {
      setServerError(null);
      await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(values)
      });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to create account");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium">Clark Email</label>
          <Input placeholder="you@clarku.edu" {...register("email")} />
          {errors.email ? <p className="text-sm text-cortex-ember">{errors.email.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Full Name</label>
          <Input placeholder="Maya Chen" {...register("name")} />
          {errors.name ? <p className="text-sm text-cortex-ember">{errors.name.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Clark ID</label>
          <Input placeholder="Optional" {...register("clarkId")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <Input type="password" placeholder="Create a strong password" {...register("password")} />
          {errors.password ? <p className="text-sm text-cortex-ember">{errors.password.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Confirm Password</label>
          <Input type="password" placeholder="Repeat your password" {...register("confirmPassword")} />
          {errors.confirmPassword ? (
            <p className="text-sm text-cortex-ember">{errors.confirmPassword.message}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-[24px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between text-sm">
          <span>Password strength</span>
          <span>{["Needs work", "Okay", "Strong", "Very strong"][Math.max(0, passwordStrength - 1)]}</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`h-2 rounded-full ${passwordStrength >= item ? "bg-cortex-ember" : "bg-black/10 dark:bg-white/10"}`}
            />
          ))}
        </div>
      </div>

      {serverError ? <p className="text-sm text-cortex-ember">{serverError}</p> : null}

      <Button className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  );
}
