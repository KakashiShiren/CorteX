import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth";
import { fail } from "@/lib/http";
import { mapUserRow, UserRow } from "@/lib/supabase/mappers";
import { getSupabaseAnonClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { signInSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signInSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid sign in payload");
    }

    const supabaseAuth = getSupabaseAnonClient();
    const supabaseService = getSupabaseServiceClient();

    if (!supabaseAuth || !supabaseService) {
      return fail("Supabase is not configured for sign in.", 500);
    }

    const authResult = await supabaseAuth.auth.signInWithPassword({
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password
    });

    if (authResult.error || !authResult.data.user) {
      return fail(authResult.error?.message ?? "Incorrect email or password", 401);
    }

    const userQuery = await supabaseService
      .from("users")
      .select(
        "id, email, name, major, year, residence, bio, profile_picture_url, interests, is_verified, is_online, searchable, show_major, show_year, show_residence, show_interests, show_online_status, message_permission, blocked_users, created_at, updated_at"
      )
      .eq("id", authResult.data.user.id)
      .single();

    if (userQuery.error) {
      return fail("Signed in to Supabase Auth, but no matching users profile was found.", 500);
    }

    const user = mapUserRow(userQuery.data as UserRow);
    const response = NextResponse.json({
      success: true,
      data: {
        user,
        session: {
          email: user.email,
          userId: user.id
        }
      }
    });

    setSessionCookie(response, user);
    return response;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to sign in");
  }
}
