import { type EmailOtpType, type User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth";
import { syncVerifiedAuthUser, VerificationSyncError } from "@/lib/auth-verification";
import { getSupabaseAnonClient, getSupabaseServiceClient } from "@/lib/supabase/server";

function redirectWithError(request: NextRequest, code: string, email?: string) {
  const url = new URL("/verify-email", request.url);
  url.searchParams.set("error", code);
  if (email) {
    url.searchParams.set("email", email);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");

  const supabaseAuth = getSupabaseAnonClient();
  const supabaseService = getSupabaseServiceClient();

  if (!supabaseAuth || !supabaseService) {
    return redirectWithError(request, "configuration");
  }

  let authUser: User | null = null;

  if (tokenHash && type) {
    const verifyResult = await supabaseAuth.auth.verifyOtp({
      token_hash: tokenHash,
      type
    });

    if (verifyResult.error) {
      return redirectWithError(request, "invalid-link");
    }

    authUser = verifyResult.data.user ?? verifyResult.data.session?.user ?? null;
  } else if (code) {
    const exchangeResult = await supabaseAuth.auth.exchangeCodeForSession(code);

    if (exchangeResult.error) {
      return redirectWithError(request, "invalid-link");
    }

    authUser = exchangeResult.data.user ?? exchangeResult.data.session?.user ?? null;
  } else {
    return redirectWithError(request, "missing-token");
  }

  const email = authUser?.email?.trim().toLowerCase();

  if (!authUser || !email) {
    return redirectWithError(request, "missing-account");
  }

  try {
    const user = await syncVerifiedAuthUser(supabaseService, authUser);
    const response = NextResponse.redirect(new URL("/feed", request.url));
    setSessionCookie(response, user);
    return response;
  } catch (error) {
    if (error instanceof VerificationSyncError) {
      return redirectWithError(request, error.code, error.email);
    }

    return redirectWithError(request, "profile-sync", email);
  }
}
