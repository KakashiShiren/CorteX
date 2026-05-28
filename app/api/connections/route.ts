import { fail, ok, requireUserId } from "@/lib/http";
import { getConnectionsForUser, getCurrentUser } from "@/lib/repository";
import {
  applyStudentConnection,
  connectionSelect,
  ConnectionRow,
  getConnectionPeerId,
  resolveConnectionRow
} from "@/lib/supabase/connections";
import { mapStudentRow, StudentRow } from "@/lib/supabase/mappers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { ConnectionRequest, Student } from "@/lib/types";
import { getCurrentUserUniversityId } from "@/lib/university";

const studentSelect =
  "id, user_id, email, name, university_id, major, year, residence, bio, profile_picture_url, interests, is_verified, is_online, current_status, created_at, updated_at";

function sortByRecent<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export async function GET() {
  try {
    const userId = requireUserId();
    if (getCurrentUser(userId)) {
      const acceptedConnections = getConnectionsForUser(userId)
        .filter((connection) => connection.status === "accepted" && connection.peer)
        .map((connection) => connection.peer!);

      return ok({
        incomingRequests: [],
        outgoingRequests: [],
        acceptedConnections,
        pendingRequestsCount: 0
      });
    }

    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for connections.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const connectionsQuery = await supabase
      .from("connections")
      .select(connectionSelect)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false });

    if (connectionsQuery.error) {
      return fail(connectionsQuery.error.message, 500);
    }

    const rows = (connectionsQuery.data ?? []) as ConnectionRow[];
    const grouped = new Map<string, ConnectionRow[]>();

    for (const row of rows) {
      const peerId = getConnectionPeerId(userId, row);
      grouped.set(peerId, [...(grouped.get(peerId) ?? []), row]);
    }

    const peerIds = [...grouped.keys()];
    let studentRows: StudentRow[] = [];

    if (peerIds.length) {
      const studentsQuery = await supabase
        .from("students")
        .select(studentSelect)
        .in("user_id", peerIds)
        .eq("university_id", universityId)
        .eq("is_verified", true);

      if (studentsQuery.error) {
        return fail(studentsQuery.error.message, 500);
      }

      studentRows = (studentsQuery.data ?? []) as StudentRow[];
    }

    const studentMap = new Map(studentRows.map((row) => [row.user_id, row]));
    const incomingRequests: ConnectionRequest[] = [];
    const outgoingRequests: ConnectionRequest[] = [];
    const acceptedConnections: Student[] = [];

    for (const [peerId, peerRows] of grouped) {
      const resolved = resolveConnectionRow(peerRows);
      const studentRow = studentMap.get(peerId);

      if (!resolved || !studentRow) {
        continue;
      }

      const student = applyStudentConnection(mapStudentRow(studentRow), userId, resolved);

      if (resolved.status === "accepted") {
        acceptedConnections.push(student);
        continue;
      }

      const request: ConnectionRequest = {
        id: resolved.id,
        status: resolved.status,
        createdAt: resolved.created_at,
        respondedAt: resolved.responded_at ?? undefined,
        direction: resolved.to_user_id === userId ? "incoming" : "outgoing",
        student
      };

      if (request.direction === "incoming") {
        incomingRequests.push(request);
      } else {
        outgoingRequests.push(request);
      }
    }

    return ok({
      incomingRequests: sortByRecent(incomingRequests),
      outgoingRequests: sortByRecent(outgoingRequests),
      acceptedConnections: acceptedConnections.sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      ),
      pendingRequestsCount: incomingRequests.length
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Unable to load connections",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
