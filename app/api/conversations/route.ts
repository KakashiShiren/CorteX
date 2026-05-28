import { fail, ok, requireUserId } from "@/lib/http";
import { parseAvatarProfilePicture } from "@/lib/avatar-colors";
import { hasAcceptedConnection } from "@/lib/supabase/connections";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { ConversationSummary, ConversationPeer } from "@/lib/types";
import { getCurrentUserUniversityId } from "@/lib/university";

type ConversationRow = {
  id: string;
  participant_ids: string[];
  last_message: string | null;
  last_message_sender_id: string | null;
  last_message_at: string;
  created_at: string;
};

type PeerRow = {
  user_id: string;
  name: string;
  major: string | null;
  year: string | null;
  residence: string | null;
  profile_picture_url: string | null;
};

const conversationSelect = "id, participant_ids, last_message, last_message_sender_id, last_message_at, created_at";
const peerSelect = "user_id, name, major, year, residence, profile_picture_url";

function mapPeer(row?: PeerRow): ConversationPeer | undefined {
  if (!row) {
    return undefined;
  }

  const avatar = parseAvatarProfilePicture(row.profile_picture_url);

  return {
    id: row.user_id,
    name: row.name,
    major: row.major ?? "Undeclared",
    year: row.year ?? "Freshman",
    residence: row.residence ?? "Off Campus",
    profilePictureUrl: avatar.profilePictureUrl,
    avatarColor: avatar.avatarColor
  };
}

function mapConversation(row: ConversationRow, userId: string, peerMap: Map<string, PeerRow>): ConversationSummary {
  const peerId = row.participant_ids.find((participantId) => participantId !== userId);

  return {
    id: row.id,
    participantIds: row.participant_ids,
    lastMessage: row.last_message ?? "",
    lastMessageSenderId: row.last_message_sender_id ?? "",
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    peer: peerId ? mapPeer(peerMap.get(peerId)) : undefined
  };
}

export async function GET() {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for conversations.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const conversationsQuery = await supabase
      .from("conversations")
      .select(conversationSelect)
      .contains("participant_ids", [userId])
      .order("last_message_at", { ascending: false });

    if (conversationsQuery.error) {
      return fail(conversationsQuery.error.message, 500);
    }

    const conversations = (conversationsQuery.data ?? []) as ConversationRow[];
    const peerIds = [...new Set(conversations.flatMap((row) => row.participant_ids.filter((id) => id !== userId)))];
    let peerRows: PeerRow[] = [];

    if (peerIds.length) {
      const peersQuery = await supabase
        .from("students")
        .select(peerSelect)
        .in("user_id", peerIds)
        .eq("university_id", universityId)
        .eq("is_verified", true);

      if (peersQuery.error) {
        return fail(peersQuery.error.message, 500);
      }

      peerRows = (peersQuery.data ?? []) as PeerRow[];
    }

    const peerMap = new Map(peerRows.map((row) => [row.user_id, row]));
    const mapped = conversations.map((row) => mapConversation(row, userId, peerMap));
    const unreadQuery = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("is_read", false);

    if (unreadQuery.error) {
      return fail(unreadQuery.error.message, 500);
    }

    return ok({
      conversations: mapped,
      total: mapped.length,
      unreadCount: unreadQuery.count ?? 0
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Unable to load conversations",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const body = (await request.json()) as Partial<{ peerId: string }>;
    const peerId = body.peerId?.trim();

    if (!peerId) {
      return fail("Choose a student to message.");
    }

    if (peerId === userId) {
      return fail("You cannot message yourself.");
    }

    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for conversations.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const peerQuery = await supabase
      .from("students")
      .select("user_id")
      .eq("user_id", peerId)
      .eq("university_id", universityId)
      .eq("is_verified", true)
      .maybeSingle();

    if (peerQuery.error) {
      return fail(peerQuery.error.message, 500);
    }

    if (!peerQuery.data) {
      return fail("You can only message students from your campus community.", 404);
    }

    if (!(await hasAcceptedConnection(supabase, userId, peerId))) {
      return fail("You can only message accepted connections.", 403);
    }

    const existingQuery = await supabase
      .from("conversations")
      .select(conversationSelect)
      .contains("participant_ids", [userId, peerId])
      .order("created_at", { ascending: true });

    if (existingQuery.error) {
      return fail(existingQuery.error.message, 500);
    }

    const existing = (existingQuery.data ?? []) as ConversationRow[];
    if (existing.length) {
      const row = existing[0];
      return ok({
        id: row.id,
        participantIds: row.participant_ids,
        lastMessage: row.last_message ?? "",
        lastMessageSenderId: row.last_message_sender_id ?? "",
        lastMessageAt: row.last_message_at,
        createdAt: row.created_at
      });
    }

    const now = new Date().toISOString();
    const insert = await supabase
      .from("conversations")
      .insert({
        participant_ids: [userId, peerId],
        last_message: "",
        last_message_sender_id: userId,
        last_message_at: now,
        created_at: now
      })
      .select(conversationSelect)
      .single();

    if (insert.error || !insert.data) {
      return fail(insert.error?.message ?? "Unable to create conversation", 500);
    }

    return ok({
      id: insert.data.id,
      participantIds: insert.data.participant_ids,
      lastMessage: insert.data.last_message ?? "",
      lastMessageSenderId: insert.data.last_message_sender_id ?? "",
      lastMessageAt: insert.data.last_message_at,
      createdAt: insert.data.created_at
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to create conversation",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
