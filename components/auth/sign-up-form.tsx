"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUniversityDetection } from "@/hooks/use-university-detection";
import { ApiError, apiFetch } from "@/lib/api";
import { signUpSchema } from "@/lib/validators";

type SignUpValues = z.infer<typeof signUpSchema>;
type VerificationResponse = {
  verificationRequired?: boolean;
  email?: string;
  universityName?: string;
  resendFailed?: boolean;
};

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
  const universityDetection = useUniversityDetection(watch("email"));

  const password = watch("password");
  const detectedUniversityName = universityDetection.visible ? universityDetection.name : undefined;
  const passwordStrength =
    Number(password.length >= 8) + Number(/[A-Z]/.test(password)) + Number(/[0-9]/.test(password));

  const redirectToVerification = (email: string, universityName?: string) => {
    const params = new URLSearchParams({
      email: email.toLowerCase()
    });

    if (universityName) {
      params.set("universityName", universityName);
    }

    router.push(`/verify-email?${params.toString()}`);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      setServerError(null);
      const result = await apiFetch<VerificationResponse>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(values)
      });

      if (result.verificationRequired) {
        redirectToVerification(result.email ?? values.email, result.universityName ?? detectedUniversityName);
        return;
      }

      router.push("/feed");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        const details = error.data as VerificationResponse | undefined;
        if (details?.verificationRequired && !details.resendFailed) {
          redirectToVerification(details.email ?? values.email, details.universityName ?? detectedUniversityName);
          return;
        }
      }

      setServerError(error instanceof Error ? error.message : "Unable to create account");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium">University Email</label>
          <Input placeholder="your@university.edu" {...register("email")} />
          {errors.email ? <p className="text-sm text-cortex-ember">{errors.email.message}</p> : null}
          {!errors.email ? (
            <p className="text-xs text-black/48 dark:text-white/52">Use your university .edu email address</p>
          ) : null}
          {universityDetection.visible ? (
            <div
              className="inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold transition-opacity duration-200"
              style={{
                backgroundColor: "#E6F4ED",
                borderColor: "#8FD4AC",
                color: "#1E5A3A"
              }}
            >
              {universityDetection.loading
                ? "Checking your university..."
                : universityDetection.found
                  ? `🎓 ${universityDetection.name}`
                  : "🎓 Your university will be created automatically"}
            </div>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Full Name</label>
          <Input placeholder="Maya Chen" {...register("name")} />
          {errors.name ? <p className="text-sm text-cortex-ember">{errors.name.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Student ID</label>
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
