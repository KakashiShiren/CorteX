import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth";
import { fail } from "@/lib/http";
import { mapUserRow, UserRow } from "@/lib/supabase/mappers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { signUpSchema } from "@/lib/validators";

export async function POST(request: Request) {
  let createdAuthUserId: string | null = null;

  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid sign up payload");
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return fail("Supabase is not configured for sign up.", 500);
    }

    const authCreate = await supabase.auth.admin.createUser({
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        name: parsed.data.name
      }
    });

    if (authCreate.error || !authCreate.data.user) {
      return fail(authCreate.error?.message ?? "Unable to create Supabase auth user", 500);
    }

    createdAuthUserId = authCreate.data.user.id;

    const profilePayload = {
      id: createdAuthUserId,
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      major: "Undeclared",
      year: "Freshman",
      residence: "Off Campus",
      bio: "New to Cortex.",
      interests: [] as string[],
      is_verified: true,
      is_online: true,
      searchable: true,
      show_major: true,
      show_year: true,
      show_residence: true,
      show_interests: true,
      show_online_status: true,
      message_permission: "connected" as const,
      blocked_users: [] as string[]
    };

    const userInsert = await supabase
      .from("users")
      .insert(profilePayload)
      .select(
        "id, email, name, major, year, residence, bio, profile_picture_url, interests, is_verified, is_online, searchable, show_major, show_year, show_residence, show_interests, show_online_status, message_permission, blocked_users, created_at, updated_at"
      )
      .single();

    if (userInsert.error) {
      await supabase.auth.admin.deleteUser(createdAuthUserId);
      return fail(`Created auth account, but failed to create users row: ${userInsert.error.message}`, 500);
    }

    const studentInsert = await supabase.from("students").insert({
      id: createdAuthUserId,
      user_id: createdAuthUserId,
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      major: "Undeclared",
      year: "Freshman",
      residence: "Off Campus",
      bio: "New to Cortex.",
      interests: [],
      is_verified: true,
      is_online: true,
      current_status: null
    });

    if (studentInsert.error) {
      await supabase.from("users").delete().eq("id", createdAuthUserId);
      await supabase.auth.admin.deleteUser(createdAuthUserId);
      return fail(`Created auth account and users row, but failed to create students row: ${studentInsert.error.message}`, 500);
    }

    const user = mapUserRow(userInsert.data as UserRow);
    const response = NextResponse.json({
      success: true,
      data: {
        user,
        message: "Account created successfully.",
        verificationRequired: false
      }
    });

    setSessionCookie(response, user);
    return response;
  } catch (error) {
    if (createdAuthUserId) {
      const supabase = getSupabaseServiceClient();
      if (supabase) {
        await supabase.from("users").delete().eq("id", createdAuthUserId);
        await supabase.from("students").delete().eq("user_id", createdAuthUserId);
        await supabase.auth.admin.deleteUser(createdAuthUserId);
      }
    }

    return fail(error instanceof Error ? error.message : "Failed to create account");
  }
}
