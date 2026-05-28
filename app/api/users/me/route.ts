import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth";
import { fail, ok, requireUserId } from "@/lib/http";
import { encodeAvatarProfilePicture, isAvatarColorPreset } from "@/lib/avatar-colors";
import { getConnectionsForUser, getCurrentUser, getUserStatus, updateCurrentUser } from "@/lib/repository";
import { mapUserRow, normalizeCurrentStatus, UserRow } from "@/lib/supabase/mappers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type StudentStatusRow = {
  current_status: unknown;
};

type ConnectionCountRow = {
  id: string;
};

type PendingConnectionRow = {
  id: string;
};

function isMissingRelationError(error: { code?: string; message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  );
}

async function ignoreMissingRelation<T extends { error: { code?: string; message?: string } | null }>(
  query: PromiseLike<T>
) {
  const result = await query;

  if (result.error && !isMissingRelationError(result.error)) {
    throw new Error(result.error.message ?? "Unable to delete account data");
  }

  return result;
}

export async function GET() {
  try {
    const userId = requireUserId();
    const demoUser = getCurrentUser(userId);

    if (demoUser) {
      const connections = getConnectionsForUser(userId);

      return ok({
        ...demoUser,
        status: getUserStatus(userId),
        connectionsCount: connections.filter((connection) => connection.status === "accepted").length,
        pendingRequestsCount: connections.filter((connection) => connection.status === "pending").length
      });
    }

    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for user sessions.", 500);
    }

    const userQuery = await supabase
      .from("users")
      .select(
        "id, email, name, university_id, major, year, residence, bio, profile_picture_url, interests, is_verified, is_online, searchable, show_major, show_year, show_residence, show_interests, show_online_status, message_permission, blocked_users, created_at, updated_at"
      )
      .eq("id", userId)
      .single();

    if (userQuery.error) {
      return fail("Session expired. Please sign in again.", 401);
    }

    const mappedUser = mapUserRow(userQuery.data as UserRow);

    const statusQuery = await supabase
      .from("students")
      .select("current_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (statusQuery.error) {
      return fail("Unable to load current status", 500);
    }

    const connectionsQuery = await supabase
      .from("connections")
      .select("id")
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .eq("status", "accepted");

    if (connectionsQuery.error) {
      return fail("Unable to load connection count", 500);
    }

    const pendingRequestsQuery = await supabase
      .from("connections")
      .select("id")
      .eq("to_user_id", userId)
      .eq("status", "pending");

    if (pendingRequestsQuery.error) {
      return fail("Unable to load pending requests", 500);
    }

    let universityName = mappedUser.universityName;
    let universityDomain = mappedUser.universityDomain;

    if (mappedUser.universityId) {
      const universityQuery = await supabase
        .from("universities")
        .select("name, domain")
        .eq("id", mappedUser.universityId)
        .maybeSingle();

      if (universityQuery.error && universityQuery.error.code !== "PGRST116") {
        return fail("Unable to load university details", 500);
      }

      universityName = universityQuery.data?.name ?? mappedUser.universityName;
      universityDomain = universityQuery.data?.domain ?? mappedUser.universityDomain;
    }

    return ok({
      ...mappedUser,
      universityName,
      universityDomain,
      status: normalizeCurrentStatus((statusQuery.data as StudentStatusRow | null)?.current_status),
      connectionsCount: ((connectionsQuery.data ?? []) as ConnectionCountRow[]).length,
      pendingRequestsCount: ((pendingRequestsQuery.data ?? []) as PendingConnectionRow[]).length
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Unable to load user",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = requireUserId();
    const demoUser = getCurrentUser(userId);

    if (demoUser) {
      const body = (await request.json()) as Partial<{
        name: string;
        major: string;
        year: string;
        residence: string;
        bio: string;
        interests: string[];
      }>;

      return ok(
        updateCurrentUser(userId, {
          name: body.name,
          major: body.major,
          year: body.year,
          residence: body.residence,
          bio: body.bio,
          interests: body.interests
        })
      );
    }

    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for profile updates.", 500);
    }

    const body = (await request.json()) as Partial<{
      name: string;
      major: string;
      year: string;
      residence: string;
      bio: string;
      interests: string[];
      avatarColor?: string | null;
      profilePictureUrl?: string | null;
    }>;

    if (body.avatarColor !== undefined && body.avatarColor !== null && !isAvatarColorPreset(body.avatarColor)) {
      return fail("Choose a valid avatar color.");
    }

    if (
      body.profilePictureUrl !== undefined &&
      body.profilePictureUrl !== null &&
      (typeof body.profilePictureUrl !== "string" || body.profilePictureUrl.length > 500)
    ) {
      return fail("Choose a valid profile image.");
    }

    const nextProfilePictureUrl =
      body.profilePictureUrl !== undefined
        ? body.profilePictureUrl?.trim() || null
        : body.avatarColor !== undefined
          ? body.avatarColor === null
            ? null
            : encodeAvatarProfilePicture(body.avatarColor)
          : undefined;

    const payload = {
      name: body.name,
      major: body.major,
      year: body.year,
      residence: body.residence,
      bio: body.bio,
      interests: body.interests,
      ...(nextProfilePictureUrl !== undefined
        ? {
            profile_picture_url: nextProfilePictureUrl
          }
        : {})
    };

    const userUpdate = await supabase
      .from("users")
      .update(payload)
      .eq("id", userId)
      .select(
        "id, email, name, university_id, major, year, residence, bio, profile_picture_url, interests, is_verified, is_online, searchable, show_major, show_year, show_residence, show_interests, show_online_status, message_permission, blocked_users, created_at, updated_at"
      )
      .single();

    if (userUpdate.error) {
      return fail(userUpdate.error.message, 500);
    }

    const studentUpdate = await supabase
      .from("students")
      .update(payload)
      .eq("user_id", userId);

    if (studentUpdate.error) {
      return fail(studentUpdate.error.message, 500);
    }

    const mappedUser = mapUserRow(userUpdate.data as UserRow);
    let universityName = mappedUser.universityName;
    let universityDomain = mappedUser.universityDomain;

    if (mappedUser.universityId) {
      const universityQuery = await supabase
        .from("universities")
        .select("name, domain")
        .eq("id", mappedUser.universityId)
        .maybeSingle();

      if (universityQuery.error && universityQuery.error.code !== "PGRST116") {
        return fail("Unable to load university details", 500);
      }

      universityName = universityQuery.data?.name ?? mappedUser.universityName;
      universityDomain = universityQuery.data?.domain ?? mappedUser.universityDomain;
    }

    return ok({
      ...mappedUser,
      universityName,
      universityDomain
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to update user",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function DELETE() {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for account deletion.", 500);
    }

    const userQuery = await supabase.from("users").select("id").eq("id", userId).maybeSingle();

    if (userQuery.error) {
      return fail(userQuery.error.message, 500);
    }

    if (!userQuery.data) {
      const response = ok({ deleted: true });
      clearSessionCookie(response);
      return response;
    }

    const ownMarketplaceItems = await supabase.from("marketplace_items").select("id").eq("user_id", userId);
    if (ownMarketplaceItems.error && !isMissingRelationError(ownMarketplaceItems.error)) {
      return fail(ownMarketplaceItems.error.message, 500);
    }
    const ownMarketplaceItemIds = ownMarketplaceItems.error
      ? []
      : ((ownMarketplaceItems.data ?? []) as Array<{ id: string }>).map((item) => item.id);

    const marketplaceOrderIds = new Set<string>();
    const directOrders = await supabase
      .from("marketplace_orders")
      .select("id")
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
    if (directOrders.error && !isMissingRelationError(directOrders.error)) {
      return fail(directOrders.error.message, 500);
    }
    if (!directOrders.error) {
      ((directOrders.data ?? []) as Array<{ id: string }>).forEach((order) => marketplaceOrderIds.add(order.id));
    }

    if (ownMarketplaceItemIds.length) {
      const itemOrders = await supabase.from("marketplace_orders").select("id").in("item_id", ownMarketplaceItemIds);
      if (itemOrders.error && !isMissingRelationError(itemOrders.error)) {
        return fail(itemOrders.error.message, 500);
      }
      if (!itemOrders.error) {
        ((itemOrders.data ?? []) as Array<{ id: string }>).forEach((order) => marketplaceOrderIds.add(order.id));
      }
    }

    const orderIds = Array.from(marketplaceOrderIds);
    if (orderIds.length) {
      await ignoreMissingRelation(supabase.from("marketplace_reviews").delete().in("order_id", orderIds));
      await ignoreMissingRelation(supabase.from("marketplace_orders").delete().in("id", orderIds));
    }

    await ignoreMissingRelation(
      supabase.from("marketplace_reviews").delete().or(`reviewer_id.eq.${userId},reviewee_id.eq.${userId}`)
    );
    await ignoreMissingRelation(supabase.from("marketplace_saves").delete().eq("user_id", userId));
    await ignoreMissingRelation(supabase.from("marketplace_items").delete().eq("user_id", userId));

    await ignoreMissingRelation(supabase.from("canvas_assignments").delete().eq("user_id", userId));
    await ignoreMissingRelation(supabase.from("canvas_integrations").delete().eq("user_id", userId));

    await ignoreMissingRelation(supabase.from("housing_comments").delete().eq("user_id", userId));
    await ignoreMissingRelation(supabase.from("housing_inquiries").delete().eq("student_id", userId));
    await ignoreMissingRelation(supabase.from("housing_posts").delete().eq("user_id", userId));
    await ignoreMissingRelation(supabase.from("ride_matches").delete().eq("passenger_id", userId));
    await ignoreMissingRelation(supabase.from("ride_posts").delete().eq("user_id", userId));

    const ownPosts = await supabase.from("posts").select("id").eq("user_id", userId);
    if (ownPosts.error && !isMissingRelationError(ownPosts.error)) {
      return fail(ownPosts.error.message, 500);
    }
    const ownPostIds = ownPosts.error ? [] : ((ownPosts.data ?? []) as Array<{ id: string }>).map((post) => post.id);

    await ignoreMissingRelation(supabase.from("post_rsvps").delete().eq("user_id", userId));
    await ignoreMissingRelation(supabase.from("post_reactions").delete().eq("user_id", userId));
    await ignoreMissingRelation(supabase.from("post_comments").delete().eq("user_id", userId));

    if (ownPostIds.length) {
      await ignoreMissingRelation(supabase.from("post_rsvps").delete().in("post_id", ownPostIds));
      await ignoreMissingRelation(supabase.from("post_reactions").delete().in("post_id", ownPostIds));
      await ignoreMissingRelation(supabase.from("post_comments").delete().in("post_id", ownPostIds));
    }

    await ignoreMissingRelation(supabase.from("posts").delete().eq("user_id", userId));

    await ignoreMissingRelation(supabase.from("chat_conversations").delete().eq("user_id", userId));
    await ignoreMissingRelation(supabase.from("messages").delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`));
    await ignoreMissingRelation(supabase.from("conversations").delete().contains("participant_ids", [userId]));

    await ignoreMissingRelation(supabase.from("connections").delete().or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`));
    await ignoreMissingRelation(supabase.from("user_status").delete().eq("user_id", userId));
    await ignoreMissingRelation(supabase.from("students").delete().eq("user_id", userId));

    const userDelete = await supabase.from("users").delete().eq("id", userId);
    if (userDelete.error) {
      return fail(userDelete.error.message, 500);
    }

    const authDelete = await supabase.auth.admin.deleteUser(userId);
    if (authDelete.error) {
      return fail(authDelete.error.message, 500);
    }

    const response = NextResponse.json({
      success: true,
      data: {
        deleted: true
      }
    });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to delete account",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 500
    );
  }
}
