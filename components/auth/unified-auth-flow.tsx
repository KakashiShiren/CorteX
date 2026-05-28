"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Search, X } from "lucide-react";
import { type UseFormRegisterReturn, useForm } from "react-hook-form";
import { z } from "zod";

import { GroveWordmark } from "@/components/auth/grove-wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUniversityDetection } from "@/hooks/use-university-detection";
import { ApiError, apiFetch } from "@/lib/api";
import {
  extractEmailDomain,
  formatUniversityName,
  isTestEmail,
  normalizeUniversityEmail
} from "@/lib/university";
import { cn } from "@/lib/utils";
import { signInSchema, signUpSchema } from "@/lib/validators";

type SignUpValues = z.infer<typeof signUpSchema>;
type SignInValues = z.infer<typeof signInSchema>;

type UniversityOption = {
  id?: string;
  name: string;
  domain: string;
};

type VerificationResponse = {
  verificationRequired?: boolean;
  email?: string;
  universityName?: string;
  resendFailed?: boolean;
};

type UniversitySearchResponse = {
  universities: UniversityOption[];
};

const DEMO_EMAIL = "demo@grove.edu";
const DEMO_PASSWORD = "Password123";

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1C1A17]" />
        <span className={cn("h-1.5 w-1.5 rounded-full", step === 2 ? "bg-[#1C1A17]" : "bg-[#D4CBBF]")} />
      </div>
      <span className="text-[11px] text-black/52">{step === 1 ? "Find your university" : "Enter your details"}</span>
    </div>
  );
}

function UniversityAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initial = name.trim().charAt(0).toUpperCase() || "U";
  const sizeClass = size === "sm" ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-xs";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[#1C1A17] font-semibold text-[#F7F0E3]",
        sizeClass
      )}
    >
      {initial}
    </div>
  );
}

function PasswordField({
  label,
  placeholder,
  error,
  registration,
  visible,
  onToggle
}: {
  label: string;
  placeholder: string;
  error?: string;
  registration: UseFormRegisterReturn;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#1C1A17]">{label}</label>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          className="pr-12"
          {...registration}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-black/42 transition hover:text-black/70"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? <p className="text-sm text-cortex-ember">{error}</p> : null}
    </div>
  );
}

function getFriendlyAuthErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials") || normalizedMessage.includes("incorrect email or password")) {
    return "Invalid email or password";
  }

  if (normalizedMessage.includes("supabase cannot be reached") || normalizedMessage.includes("fetch failed")) {
    return "Live sign in is unavailable right now. Check the local Supabase settings and try again.";
  }

  if (normalizedMessage.includes("already has a grove account")) {
    return "This email is already registered. Sign in instead.";
  }

  if (normalizedMessage.includes(".edu email")) {
    return "Please use your university .edu email";
  }

  return message;
}

export function UnifiedAuthFlow({
  redirectTo = "/feed",
  initialMode = "signup",
  initialStep = 1
}: {
  redirectTo?: string;
  initialMode?: "signup" | "signin";
  initialStep?: 1 | 2;
}) {
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityOption | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UniversityOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchSettled, setSearchSettled] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<{ email: string; universityName: string } | null>(null);
  const [signupCooldown, setSignupCooldown] = useState(60);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [didBlurSignUpEmail, setDidBlurSignUpEmail] = useState(false);

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
      clarkId: ""
    }
  });

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true
    }
  });

  const signUpEmail = signUpForm.watch("email");
  const signInEmail = signInForm.watch("email");
  const signUpDetection = useUniversityDetection(signUpEmail);
  const signInDetection = useUniversityDetection(signInEmail);
  const signUpEmailField = signUpForm.register("email");

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!signupSuccess || signupCooldown === 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSignupCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [signupCooldown, signupSuccess]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (step !== 1 || !trimmedQuery) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchSettled(false);
      return undefined;
    }

    const abortController = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await fetch(`/api/universities/search?q=${encodeURIComponent(trimmedQuery)}`, {
          method: "GET",
          cache: "no-store",
          signal: abortController.signal
        });
        const payload = (await response.json()) as {
          success?: boolean;
          data?: UniversitySearchResponse;
        };

        if (!response.ok || !payload.success || !payload.data) {
          setSearchResults([]);
          setSearchSettled(true);
          return;
        }

        setSearchResults(payload.data.universities);
        setSearchSettled(true);
      } catch (error) {
        if (!abortController.signal.aborted) {
          setSearchResults([]);
          setSearchSettled(true);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      abortController.abort();
      window.clearTimeout(timer);
    };
  }, [searchQuery, step]);

  function getEmailPlaceholder() {
    if (selectedUniversity?.domain) {
      return `your@${selectedUniversity.domain}`;
    }

    return "your@university.edu";
  }

  function redirectToVerification(email: string, universityName?: string) {
    const params = new URLSearchParams({
      email: email.toLowerCase()
    });

    if (universityName) {
      params.set("universityName", universityName);
    }

    router.push(`/verify-email?${params.toString()}`);
  }

  function transitionToStep(nextStep: 1 | 2, nextUniversity: UniversityOption | null) {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }

    setContentVisible(false);
    setSearchOpen(false);
    transitionTimerRef.current = window.setTimeout(() => {
      setStep(nextStep);
      setSelectedUniversity(nextUniversity);
      if (nextStep === 1) {
        setSearchQuery("");
        setSearchResults([]);
        setSearchOpen(false);
        setSearchSettled(false);
      }

      window.requestAnimationFrame(() => setContentVisible(true));
    }, 200);
  }

  function goToUniversityStep() {
    transitionToStep(1, null);
    setSignupSuccess(null);
    setSignUpError(null);
    setSignInError(null);
  }

  function goToDetailsStep(university: UniversityOption | null) {
    transitionToStep(2, university);
    setSignUpError(null);
    setSignInError(null);
  }

  async function handleSignUpSubmit(values: SignUpValues) {
    try {
      setSignUpError(null);
      const result = await apiFetch<VerificationResponse>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(values)
      });

      if (result.verificationRequired) {
        redirectToVerification(
          result.email ?? values.email,
          result.universityName ??
            (signUpDetection.visible ? signUpDetection.name : undefined) ??
            selectedUniversity?.name
        );
        return;
      }

      router.push("/feed");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        const details = error.data as VerificationResponse | undefined;
        if (details?.verificationRequired && !details.resendFailed) {
          redirectToVerification(
            details.email ?? values.email,
            details.universityName ??
              (signUpDetection.visible ? signUpDetection.name : undefined) ??
              selectedUniversity?.name
          );
          return;
        }
      }

      setSignUpError(
        getFriendlyAuthErrorMessage(error instanceof Error ? error.message : "Unable to create account")
      );
    }
  }

  async function handleSignInSubmit(values: SignInValues) {
    try {
      setSignInError(null);
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
          redirectToVerification(
            details.email ?? values.email,
            details.universityName ?? (signInDetection.visible ? signInDetection.name : undefined)
          );
          return;
        }
      }

      setSignInError(getFriendlyAuthErrorMessage(error instanceof Error ? error.message : "Unable to sign in"));
    }
  }

  async function handleResendVerification() {
    if (!signupSuccess) {
      return;
    }

    try {
      setIsResendingVerification(true);
      await apiFetch("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email: signupSuccess.email })
      });
      setSignupCooldown(60);
      setSignUpError(null);
    } catch (error) {
      setSignUpError(
        getFriendlyAuthErrorMessage(
          error instanceof Error ? error.message : "Unable to resend the confirmation email."
        )
      );
    } finally {
      setIsResendingVerification(false);
    }
  }

  const normalizedSignUpEmail = normalizeUniversityEmail(signUpEmail);
  const signUpDomain = extractEmailDomain(normalizedSignUpEmail);
  const detectedUniversityName = signUpDetection.visible ? signUpDetection.name : undefined;
  const mismatchUniversityName =
    detectedUniversityName ??
    (signUpDomain?.endsWith(".edu") ? formatUniversityName(signUpDomain) : undefined);
  const signUpEmailMismatch =
    Boolean(
      selectedUniversity &&
        didBlurSignUpEmail &&
        mismatchUniversityName &&
        !signUpForm.formState.errors.email &&
        (!isTestEmail(normalizedSignUpEmail)
          ? signUpDomain && signUpDomain !== selectedUniversity.domain.toLowerCase()
          : mismatchUniversityName.toLowerCase() !== selectedUniversity.name.toLowerCase())
    ) && !signUpDetection.loading;

  const showSearchDropdown =
    searchOpen && Boolean(searchQuery.trim()) && (searchLoading || searchResults.length > 0 || searchSettled);

  return (
    <div className="flex min-h-full flex-col md:justify-center">
      {step === 1 ? (
        <div className="mb-10 flex justify-center md:hidden">
          <GroveWordmark tone="dark" compact />
        </div>
      ) : null}

      <div className={cn("transition-opacity duration-200", contentVisible ? "opacity-100" : "opacity-0")}>
        {step === 1 ? (
          <section className="mx-auto w-full max-w-full sm:max-w-[430px]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/46">Get Started</div>
            <h1 className="mt-4 font-display text-[2rem] leading-[1.1] text-[#1C1A17]">Find your university</h1>
            <p className="mt-3 max-w-md text-[13px] leading-[1.6] text-black/58">
              Search for your university to get started. Grove works with any .edu email.
            </p>
            <StepIndicator step={1} />

            <div ref={searchContainerRef} className="relative mt-8">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/34" />
                <Input
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search for your university..."
                  className="pl-10"
                />
              </div>

              {showSearchDropdown ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-60 overflow-y-auto rounded-[10px] border border-black/8 bg-[#fffaf3] shadow-[0_16px_36px_rgba(18,17,15,0.08)]">
                  {searchLoading ? (
                    <div className="px-4 py-3 text-sm text-black/50">Searching universities...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((university) => (
                      <button
                        key={university.id ?? university.domain}
                        type="button"
                        onClick={() => goToDetailsStep(university)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-black/[0.03]"
                      >
                        <UniversityAvatar name={university.name} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-[#1C1A17]">{university.name}</div>
                          <div className="truncate text-[11px] text-black/48">{university.domain}</div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      onClick={() => goToDetailsStep(null)}
                      className="w-full px-4 py-3 text-left transition hover:bg-black/[0.03]"
                    >
                      <div className="text-[13px] font-semibold text-[#1C1A17]">
                        {"\u{1F393}"} {searchQuery.trim()} - not listed yet
                      </div>
                      <div className="mt-1 text-[11px] text-black/48">
                        You can still sign up with your .edu email
                      </div>
                    </button>
                  )}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => goToDetailsStep(null)}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-black/58 transition hover:text-[#1C1A17]"
            >
              <span>Skip - I&apos;ll enter my email directly</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </section>
        ) : (
          <section className="mx-auto w-full max-w-full sm:max-w-[430px]">
            <button
              type="button"
              onClick={goToUniversityStep}
              className="inline-flex items-center gap-2 text-[11px] font-medium text-black/48 transition hover:text-[#1C1A17]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>

            <div className="mt-6">
              {selectedUniversity ? (
                <div className="flex items-center justify-between rounded-[22px] border border-black/8 bg-[#fffaf3]/92 px-4 py-3 shadow-[0_14px_32px_rgba(18,17,15,0.06)]">
                  <div className="flex items-center gap-3">
                    <UniversityAvatar name={selectedUniversity.name} />
                    <div>
                      <div className="text-[13px] font-semibold text-[#1C1A17]">{selectedUniversity.name}</div>
                      <div className="text-[11px] text-black/48">{selectedUniversity.domain}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={goToUniversityStep}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black/42 transition hover:bg-black/[0.04] hover:text-[#1C1A17]"
                    aria-label="Choose a different university"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <GroveWordmark tone="dark" compact />
              )}
            </div>

            {!signupSuccess ? (
              <div className="mt-8 rounded-full bg-black/[0.05] p-1">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setSignUpError(null);
                    }}
                    className={cn(
                      "rounded-full px-4 py-2.5 text-sm font-medium transition",
                      mode === "signup" ? "bg-[#1C1A17] text-[#F7F0E3]" : "text-black/48 hover:text-[#1C1A17]"
                    )}
                  >
                    Sign up
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setSignInError(null);
                    }}
                    className={cn(
                      "rounded-full px-4 py-2.5 text-sm font-medium transition",
                      mode === "signin" ? "bg-[#1C1A17] text-[#F7F0E3]" : "text-black/48 hover:text-[#1C1A17]"
                    )}
                  >
                    Sign in
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-8">
              <h1 className="font-display text-[2rem] leading-[1.1] text-[#1C1A17]">
                {signupSuccess ? "Check your inbox" : mode === "signup" ? "Create your account" : "Welcome back"}
              </h1>
              <StepIndicator step={2} />
            </div>

            {signupSuccess ? (
              <div className="mt-8 space-y-6">
                <p className="text-[14px] leading-[1.7] text-black/58">
                  We sent a verification code to {signupSuccess.email}. Enter it on the verification page to activate
                  your Grove account and join {signupSuccess.universityName}.
                </p>
                <button
                  type="button"
                  disabled={signupCooldown > 0 || isResendingVerification}
                  onClick={() => void handleResendVerification()}
                  className="inline-flex items-center gap-2 text-sm font-medium text-black/58 transition hover:text-[#1C1A17] disabled:cursor-not-allowed disabled:text-black/35"
                >
                  <span>
                    {isResendingVerification
                      ? "Sending..."
                      : signupCooldown > 0
                        ? `Didn't get it? Resend in ${signupCooldown}s`
                        : "Didn't get it? Resend"}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                {signUpError ? <p className="text-sm text-cortex-ember">{signUpError}</p> : null}
              </div>
            ) : mode === "signup" ? (
              <form onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1A17]">Full name</label>
                  <Input placeholder="Your full name" {...signUpForm.register("name")} />
                  {signUpForm.formState.errors.name ? (
                    <p className="text-sm text-cortex-ember">{signUpForm.formState.errors.name.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1A17]">Email</label>
                  <Input
                    placeholder={getEmailPlaceholder()}
                    {...signUpEmailField}
                    onBlur={(event) => {
                      signUpEmailField.onBlur(event);
                      setDidBlurSignUpEmail(true);
                    }}
                  />
                  {signUpForm.formState.errors.email ? (
                    <p className="text-sm text-cortex-ember">{signUpForm.formState.errors.email.message}</p>
                  ) : null}
                  {!signUpForm.formState.errors.email && signUpDetection.visible ? (
                    <div className="inline-flex items-center rounded-full border border-[#d5c3aa] bg-[#fff6eb] px-3 py-1 text-[12px] font-semibold text-[#5f4735]">
                      {signUpDetection.loading
                        ? "Checking your university..."
                        : signUpDetection.found
                          ? `${"\u{1F393}"} ${signUpDetection.name}`
                          : `${"\u{1F393}"} ${signUpDetection.name}`}
                    </div>
                  ) : null}
                  {signUpEmailMismatch ? (
                    <p className="text-xs leading-5 text-[#7c5a2f]">
                      Heads up - this email is from {mismatchUniversityName}, not {selectedUniversity?.name}. We&apos;ll
                      use {mismatchUniversityName}.
                    </p>
                  ) : null}
                </div>

                <PasswordField
                  label="Password"
                  placeholder="Create a password"
                  error={signUpForm.formState.errors.password?.message}
                  registration={signUpForm.register("password")}
                  visible={showSignUpPassword}
                  onToggle={() => setShowSignUpPassword((current) => !current)}
                />

                <PasswordField
                  label="Confirm password"
                  placeholder="Confirm your password"
                  error={signUpForm.formState.errors.confirmPassword?.message}
                  registration={signUpForm.register("confirmPassword")}
                  visible={showSignUpConfirmPassword}
                  onToggle={() => setShowSignUpConfirmPassword((current) => !current)}
                />

                {signUpError ? <p className="text-sm text-cortex-ember">{signUpError}</p> : null}

                <Button className="w-full" size="lg" disabled={signUpForm.formState.isSubmitting}>
                  {signUpForm.formState.isSubmitting ? "Creating Account..." : "Create Account"}
                </Button>

                <div className="text-center text-sm text-black/56">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setSignUpError(null);
                    }}
                    className="font-medium text-[#1C1A17] transition hover:text-black/70"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={signInForm.handleSubmit(handleSignInSubmit)} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1A17]">Email</label>
                  <Input placeholder={getEmailPlaceholder()} {...signInForm.register("email")} />
                  {signInForm.formState.errors.email ? (
                    <p className="text-sm text-cortex-ember">{signInForm.formState.errors.email.message}</p>
                  ) : null}
                  {!signInForm.formState.errors.email && signInDetection.visible && !signInDetection.loading ? (
                    <div className="inline-flex items-center rounded-full border border-[#d5c3aa] bg-[#fff6eb] px-3 py-1 text-[12px] font-semibold text-[#5f4735]">
                      {`${"\u{1F393}"} ${signInDetection.name}`}
                    </div>
                  ) : null}
                </div>

                <PasswordField
                  label="Password"
                  placeholder="Your password"
                  error={signInForm.formState.errors.password?.message}
                  registration={signInForm.register("password")}
                  visible={showSignInPassword}
                  onToggle={() => setShowSignInPassword((current) => !current)}
                />

                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-[11px] font-medium text-black/52 transition hover:text-[#1C1A17]">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    signInForm.setValue("email", DEMO_EMAIL, { shouldDirty: true, shouldValidate: true });
                    signInForm.setValue("password", DEMO_PASSWORD, { shouldDirty: true, shouldValidate: true });
                    setSignInError(null);
                  }}
                  className="w-full rounded-[14px] border border-black/8 bg-[#fffaf3]/80 px-4 py-3 text-left text-[12px] leading-5 text-black/58 transition hover:border-black/14 hover:bg-white"
                >
                  <span className="font-semibold text-[#1C1A17]">Use demo account</span>
                  <span className="block">Email: {DEMO_EMAIL} / Password: {DEMO_PASSWORD}</span>
                </button>

                {signInError ? <p className="text-sm text-cortex-ember">{signInError}</p> : null}

                <Button className="w-full" size="lg" disabled={signInForm.formState.isSubmitting}>
                  {signInForm.formState.isSubmitting ? "Signing In..." : "Sign In"}
                </Button>

                <div className="text-center text-sm text-black/56">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setSignInError(null);
                    }}
                    className="font-medium text-[#1C1A17] transition hover:text-black/70"
                  >
                    Sign up
                  </button>
                </div>
              </form>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
