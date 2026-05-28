import { NextRequest } from "next/server";

import { fail, ok, requireUserId } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getCurrentUser, listStudents } from "@/lib/repository";
import {
  connectionSelect,
  ConnectionRow,
  getConnectionPeerId,
  mapStudentConnectionState,
  resolveConnectionRow
} from "@/lib/supabase/connections";
import { SearchFilters, Student } from "@/lib/types";
import { mapStudentRow, StudentRow } from "@/lib/supabase/mappers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getCurrentUserUniversityId } from "@/lib/university";

export const dynamic = "force-dynamic";

function sanitizeLikeQuery(value: string) {
  return value.replace(/[%_]/g, "").trim();
}

async function listStudentsFromSupabase(filters: SearchFilters, userId: string) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    throw new Error("Supabase is not configured for student search.");
  }

  const universityId = await getCurrentUserUniversityId(supabase, userId);
  if (!universityId) {
    throw new Error("Your campus workspace is still being prepared.");
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 12;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const fetchFrom = filters.liveStatus ? 0 : from;
  const fetchTo = filters.liveStatus ? Math.max(limit * 8, 95) : to;

  const buildBaseQuery = () => {
    let query = supabase
      .from("students")
      .select(
        "id, user_id, email, name, university_id, major, year, residence, bio, profile_picture_url, interests, is_verified, is_online, current_status, created_at, updated_at",
        { count: "exact" }
      )
      .eq("is_verified", true)
      .eq("university_id", universityId)
      .neq("user_id", userId);

    if (filters.major) {
      query = query.eq("major", filters.major);
    }

    if (filters.year) {
      query = query.eq("year", filters.year);
    }

    if (filters.residence) {
      query = query.eq("residence", filters.residence);
    }

    return query.order("updated_at", { ascending: false });
  };

  const searchQuery = filters.q?.trim();
  let studentsQuery;

  if (searchQuery) {
    studentsQuery = await buildBaseQuery()
      .textSearch("search_text", searchQuery, {
        config: "english",
        type: "websearch"
      })
      .range(from, to);

    if (studentsQuery.error) {
      const safeQuery = sanitizeLikeQuery(searchQuery);
      studentsQuery = await buildBaseQuery()
        .or(
          [
            `name.ilike.%${safeQuery}%`,
            `major.ilike.%${safeQuery}%`,
            `year.ilike.%${safeQuery}%`,
            `residence.ilike.%${safeQuery}%`,
            `bio.ilike.%${safeQuery}%`
          ].join(",")
        )
        .range(fetchFrom, fetchTo);
    }
  } else {
    studentsQuery = await buildBaseQuery().range(fetchFrom, fetchTo);
  }

  if (studentsQuery.error) {
    throw studentsQuery.error;
  }

  const studentRows = (studentsQuery.data ?? []) as StudentRow[];
  const studentUserIds = studentRows.map((row) => row.user_id);
  const studentUserIdSet = new Set(studentUserIds);
  const connectionMap = new Map<string, Pick<Student, "connectionId" | "connectionStatus">>();

  if (studentUserIds.length) {
    const connectionsQuery = await supabase
      .from("connections")
      .select(connectionSelect)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

    if (connectionsQuery.error) {
      throw connectionsQuery.error;
    }

    const groupedConnections = new Map<string, ConnectionRow[]>();

    for (const connection of (connectionsQuery.data ?? []) as ConnectionRow[]) {
      const peerId = getConnectionPeerId(userId, connection);
      if (!studentUserIdSet.has(peerId)) {
        continue;
      }

      groupedConnections.set(peerId, [...(groupedConnections.get(peerId) ?? []), connection]);
    }

    for (const [peerId, rows] of groupedConnections) {
      const resolved = resolveConnectionRow(rows);
      if (!resolved) {
        continue;
      }

      connectionMap.set(peerId, mapStudentConnectionState(userId, resolved));
    }
  }

  const mappedStudents = studentRows.map((row) => mapStudentRow(row, connectionMap.get(row.user_id)));
  const filteredStudents =
    filters.liveStatus === "available"
      ? mappedStudents.filter((student) => Boolean(student.currentStatus))
      : filters.liveStatus === "unavailable"
        ? mappedStudents.filter((student) => !student.currentStatus)
        : mappedStudents;

  const pagedStudents = filters.liveStatus ? filteredStudents.slice(from, from + limit) : filteredStudents;
  const effectiveTotal = filters.liveStatus ? filteredStudents.length : studentsQuery.count ?? filteredStudents.length;

  return {
    students: pagedStudents,
    total: effectiveTotal,
    hasMore: effectiveTotal > from + pagedStudents.length
  };
}

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserId();

    if (!enforceRateLimit(`student-search:${userId}`, 60, 60_000)) {
      return fail("Search rate limit exceeded", 429);
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      q: searchParams.get("q") ?? undefined,
      major: searchParams.get("major") ?? undefined,
      year: searchParams.get("year") ?? undefined,
      residence: searchParams.get("residence") ?? undefined,
      liveStatus:
        searchParams.get("liveStatus") === "available" || searchParams.get("liveStatus") === "unavailable"
          ? (searchParams.get("liveStatus") as "available" | "unavailable")
          : undefined,
      page: Number(searchParams.get("page") ?? "1"),
      limit: Number(searchParams.get("limit") ?? "12")
    };

    if (getCurrentUser(userId)) {
      return ok(listStudents(filters, userId));
    }

    return ok(await listStudentsFromSupabase(filters, userId));
  } catch (error) {
    console.error("[students/search] Failed to query students.", error);
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to search students",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
