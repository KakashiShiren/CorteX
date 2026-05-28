import { NextResponse } from "next/server";

import {
  buildCanvasAuthorizeUrl,
  exchangeCanvasCode,
  getCurrentUserUniversity,
  syncCanvasAssignments
} from "@/lib/canvas";
import { requireUserId } from "@/lib/http";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return NextResponse.redirect(new URL("/settings/canvas?error=supabase", request.url));
    }

    const university = await getCurrentUserUniversity(supabase, userId);
    if (!university) {
      return NextResponse.redirect(new URL("/settings/canvas?error=university", request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      const state = Buffer.from(JSON.stringify({ userId, t: Date.now() })).toString("base64url");
      return NextResponse.redirect(buildCanvasAuthorizeUrl({ request, university, state }));
    }

    const { config, token } = await exchangeCanvasCode({ request, university, code });
    const tokenExpiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null;

    const upsertQuery = await supabase
      .from("canvas_integrations")
      .upsert({
        user_id: userId,
        canvas_user_id: token.user?.id ? String(token.user.id) : null,
        canvas_access_token: token.access_token,
        canvas_refresh_token: token.refresh_token ?? null,
        token_expires_at: tokenExpiresAt,
        university_id: university.id,
        canvas_base_url: config.baseUrl,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id"
      });

    if (upsertQuery.error) {
      return NextResponse.redirect(new URL("/settings/canvas?error=store", request.url));
    }

    try {
      await syncCanvasAssignments(supabase, userId);
    } catch {
      return NextResponse.redirect(new URL("/settings/canvas?connected=1&sync=failed", request.url));
    }

    return NextResponse.redirect(new URL("/settings/canvas?connected=1", request.url));
  } catch (error) {
    const destination =
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "/auth?redirectTo=%2Fsettings%2Fcanvas"
        : "/settings/canvas?error=canvas";

    return NextResponse.redirect(new URL(destination, request.url));
  }
}
