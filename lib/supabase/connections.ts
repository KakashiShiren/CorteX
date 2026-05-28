import { Student, StudentConnectionStatus } from "@/lib/types";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export type ConnectionRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  responded_at: string | null;
};

export type SupabaseServiceClient = NonNullable<ReturnType<typeof getSupabaseServiceClient>>;

export const connectionSelect = "id, from_user_id, to_user_id, status, created_at, responded_at";

export function getConnectionPeerId(userId: string, row: ConnectionRow) {
  return row.from_user_id === userId ? row.to_user_id : row.from_user_id;
}

export function mapStudentConnectionState(
  userId: string,
  row?: ConnectionRow | null
): {
  connectionId?: string;
  connectionStatus: StudentConnectionStatus;
} {
  if (!row || row.status === "rejected") {
    return {
      connectionStatus: "none"
    };
  }

  if (row.status === "accepted") {
    return {
      connectionId: row.id,
      connectionStatus: "connected"
    };
  }

  return {
    connectionId: row.id,
    connectionStatus: row.from_user_id === userId ? "outgoing_pending" : "incoming_pending"
  };
}

export function applyStudentConnection(
  student: Student,
  userId: string,
  row?: ConnectionRow | null
): Student {
  return {
    ...student,
    ...mapStudentConnectionState(userId, row)
  };
}

function sortConnectionRows(rows: ConnectionRow[]) {
  return [...rows].sort((left, right) => {
    const priority = {
      accepted: 3,
      pending: 2,
      rejected: 1
    } as const;

    if (priority[left.status] !== priority[right.status]) {
      return priority[right.status] - priority[left.status];
    }

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
}

export function resolveConnectionRow(rows: ConnectionRow[]) {
  return sortConnectionRows(rows)[0] ?? null;
}

export async function findConnectionsBetween(
  supabase: SupabaseServiceClient,
  userId: string,
  peerId: string
) {
  const query = await supabase
    .from("connections")
    .select(connectionSelect)
    .or(`and(from_user_id.eq.${userId},to_user_id.eq.${peerId}),and(from_user_id.eq.${peerId},to_user_id.eq.${userId})`);

  if (query.error) {
    throw query.error;
  }

  return (query.data ?? []) as ConnectionRow[];
}

export async function findResolvedConnection(
  supabase: SupabaseServiceClient,
  userId: string,
  peerId: string
) {
  return resolveConnectionRow(await findConnectionsBetween(supabase, userId, peerId));
}

export async function hasAcceptedConnection(
  supabase: SupabaseServiceClient,
  userId: string,
  peerId: string
) {
  const rows = await findConnectionsBetween(supabase, userId, peerId);
  return rows.some((row) => row.status === "accepted");
}
