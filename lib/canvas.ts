import type { SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

export interface CanvasCourse {
  id: string;
  name: string;
  courseCode?: string;
}

export interface CanvasAssignment {
  id: string;
  userId: string;
  canvasAssignmentId: string;
  canvasCourseId: string;
  courseName: string;
  assignmentName: string;
  description?: string;
  dueDate?: string;
  submitted: boolean;
  canvasUrl?: string;
  locallyDone: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CanvasIntegrationRow = {
  id: string;
  user_id: string;
  canvas_user_id: string | null;
  canvas_access_token: string | null;
  canvas_refresh_token: string | null;
  token_expires_at: string | null;
  university_id: string | null;
  canvas_base_url: string | null;
  last_synced_at: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
};

export type CanvasAssignmentRow = {
  id: string;
  user_id: string;
  canvas_assignment_id: string | null;
  canvas_course_id: string | null;
  course_name: string | null;
  assignment_name: string | null;
  description: string | null;
  due_date: string | null;
  submitted: boolean | null;
  canvas_url: string | null;
  locally_done: boolean | null;
  created_at: string;
  updated_at: string;
};

type UniversityRow = {
  id: string;
  name: string;
  domain: string;
};

type CanvasTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user?: {
    id?: string | number;
  };
};

type CanvasCourseResponse = {
  id: number | string;
  name?: string;
  course_code?: string;
};

type CanvasAssignmentResponse = {
  id: number | string;
  name?: string;
  description?: string;
  due_at?: string | null;
  html_url?: string;
  submission?: {
    submitted_at?: string | null;
    workflow_state?: string | null;
  };
};

export const canvasIntegrationSelect =
  "id, user_id, canvas_user_id, canvas_access_token, canvas_refresh_token, token_expires_at, university_id, canvas_base_url, last_synced_at, is_active, created_at, updated_at";

export const canvasAssignmentSelect =
  "id, user_id, canvas_assignment_id, canvas_course_id, course_name, assignment_name, description, due_date, submitted, canvas_url, locally_done, created_at, updated_at";

const canvasHostByDomain: Record<string, string> = {
  "clarku.edu": "https://canvas.clarku.edu",
  "northeastern.edu": "https://canvas.northeastern.edu",
  "wpi.edu": "https://canvas.wpi.edu",
  "bu.edu": "https://canvas.bu.edu",
  "holycross.edu": "https://canvas.holycross.edu"
};

function normalizeTimestamp(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
}

function getOriginFromRequest(request: Request) {
  const configured = env.appUrl?.trim();

  if (configured) {
    if (configured.startsWith("http://") || configured.startsWith("https://")) {
      return configured.replace(/\/$/, "");
    }

    return `https://${configured.replace(/\/$/, "")}`;
  }

  return new URL(request.url).origin;
}

function getCanvasKeyForDomain(domain: string) {
  if (domain === "clarku.edu") {
    return "CLARK";
  }

  if (domain === "northeastern.edu") {
    return "NEU";
  }

  if (domain === "holycross.edu") {
    return "HOLYCROSS";
  }

  return domain.replace(/\.edu$/, "").replace(/[^a-z0-9]/gi, "_").toUpperCase();
}

function getCanvasCredentials(key: string) {
  const credentialsByKey: Record<string, { clientId?: string; clientSecret?: string }> = {
    CLARK: {
      clientId: env.canvasClarkClientId,
      clientSecret: env.canvasClarkClientSecret
    },
    NEU: {
      clientId: env.canvasNeuClientId ?? env.canvasNortheasternClientId,
      clientSecret: env.canvasNeuClientSecret ?? env.canvasNortheasternClientSecret
    },
    NORTHEASTERN: {
      clientId: env.canvasNortheasternClientId ?? env.canvasNeuClientId,
      clientSecret: env.canvasNortheasternClientSecret ?? env.canvasNeuClientSecret
    },
    WPI: {
      clientId: env.canvasWpiClientId,
      clientSecret: env.canvasWpiClientSecret
    },
    BU: {
      clientId: env.canvasBuClientId,
      clientSecret: env.canvasBuClientSecret
    },
    HOLYCROSS: {
      clientId: env.canvasHolyCrossClientId,
      clientSecret: env.canvasHolyCrossClientSecret
    }
  };

  return credentialsByKey[key] ?? {
    clientId: process.env[`CANVAS_${key}_CLIENT_ID`],
    clientSecret: process.env[`CANVAS_${key}_CLIENT_SECRET`]
  };
}

export async function getCurrentUserUniversity(supabase: SupabaseClient, userId: string) {
  const userQuery = await supabase
    .from("users")
    .select("university_id")
    .eq("id", userId)
    .single();

  if (userQuery.error) {
    throw new Error(userQuery.error.message);
  }

  if (!userQuery.data?.university_id) {
    return null;
  }

  const universityQuery = await supabase
    .from("universities")
    .select("id, name, domain")
    .eq("id", userQuery.data.university_id)
    .maybeSingle();

  if (universityQuery.error && universityQuery.error.code !== "PGRST116") {
    throw new Error(universityQuery.error.message);
  }

  return (universityQuery.data as UniversityRow | null) ?? null;
}

export function getCanvasConfig(university: Pick<UniversityRow, "domain" | "name">) {
  const domain = university.domain.trim().toLowerCase();
  const key = getCanvasKeyForDomain(domain);
  const credentials = getCanvasCredentials(key);

  return {
    key,
    baseUrl: canvasHostByDomain[domain] ?? `https://canvas.${domain}`,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret
  };
}

export function buildCanvasAuthorizeUrl({
  request,
  university,
  state
}: {
  request: Request;
  university: UniversityRow;
  state: string;
}) {
  const config = getCanvasConfig(university);

  if (!config.clientId) {
    throw new Error(`Canvas OAuth is not configured for ${university.name}.`);
  }

  const redirectUri = `${getOriginFromRequest(request)}/api/auth/canvas/callback`;
  const url = new URL("/login/oauth2/auth", config.baseUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set(
    "scope",
    "url:GET|/api/v1/courses url:GET|/api/v1/courses/:course_id/assignments"
  );

  return url.toString();
}

export async function exchangeCanvasCode({
  request,
  university,
  code
}: {
  request: Request;
  university: UniversityRow;
  code: string;
}) {
  const config = getCanvasConfig(university);

  if (!config.clientId || !config.clientSecret) {
    throw new Error(`Canvas OAuth is not configured for ${university.name}.`);
  }

  const response = await fetch(new URL("/login/oauth2/token", config.baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: `${getOriginFromRequest(request)}/api/auth/canvas/callback`,
      code
    })
  });

  if (!response.ok) {
    throw new Error("Canvas rejected the authorization code.");
  }

  return {
    config,
    token: (await response.json()) as CanvasTokenResponse
  };
}

export function mapCanvasAssignment(row: CanvasAssignmentRow): CanvasAssignment {
  return {
    id: row.id,
    userId: row.user_id,
    canvasAssignmentId: row.canvas_assignment_id ?? "",
    canvasCourseId: row.canvas_course_id ?? "",
    courseName: row.course_name ?? "Canvas course",
    assignmentName: row.assignment_name ?? "Untitled assignment",
    description: row.description ?? undefined,
    dueDate: normalizeTimestamp(row.due_date),
    submitted: Boolean(row.submitted),
    canvasUrl: row.canvas_url ?? undefined,
    locallyDone: Boolean(row.locally_done),
    createdAt: normalizeTimestamp(row.created_at) ?? new Date().toISOString(),
    updatedAt: normalizeTimestamp(row.updated_at) ?? new Date().toISOString()
  };
}

function parseNextLink(header: string | null) {
  if (!header) {
    return null;
  }

  const nextPart = header.split(",").find((part) => part.includes('rel="next"'));
  const match = nextPart?.match(/<([^>]+)>/);
  return match?.[1] ?? null;
}

async function fetchCanvasPaginated<T>(initialUrl: string, accessToken: string) {
  const results: T[] = [];
  let nextUrl: string | null = initialUrl;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error("Canvas API request failed.");
    }

    const page = (await response.json()) as T[];
    results.push(...page);
    nextUrl = parseNextLink(response.headers.get("link"));
  }

  return results;
}

async function refreshCanvasAccessToken(supabase: SupabaseClient, integration: CanvasIntegrationRow) {
  if (!integration.canvas_refresh_token || !integration.canvas_base_url) {
    return integration;
  }

  const universityQuery = integration.university_id
    ? await supabase.from("universities").select("id, name, domain").eq("id", integration.university_id).maybeSingle()
    : { data: null, error: null };

  if (universityQuery.error && universityQuery.error.code !== "PGRST116") {
    throw new Error(universityQuery.error.message);
  }

  const university = universityQuery.data as UniversityRow | null;
  const config = university ? getCanvasConfig(university) : null;

  if (!config?.clientId || !config.clientSecret) {
    return integration;
  }

  const response = await fetch(new URL("/login/oauth2/token", integration.canvas_base_url), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: integration.canvas_refresh_token
    })
  });

  if (!response.ok) {
    return integration;
  }

  const token = (await response.json()) as CanvasTokenResponse;
  const tokenExpiresAt = token.expires_in
    ? new Date(Date.now() + token.expires_in * 1000).toISOString()
    : integration.token_expires_at;

  const updateQuery = await supabase
    .from("canvas_integrations")
    .update({
      canvas_access_token: token.access_token,
      canvas_refresh_token: token.refresh_token ?? integration.canvas_refresh_token,
      token_expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString()
    })
    .eq("id", integration.id)
    .select(canvasIntegrationSelect)
    .single();

  if (updateQuery.error) {
    throw new Error(updateQuery.error.message);
  }

  return updateQuery.data as CanvasIntegrationRow;
}

export async function getActiveCanvasIntegration(supabase: SupabaseClient, userId: string) {
  const query = await supabase
    .from("canvas_integrations")
    .select(canvasIntegrationSelect)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (query.error && query.error.code !== "PGRST116") {
    throw new Error(query.error.message);
  }

  const integration = (query.data as CanvasIntegrationRow | null) ?? null;

  if (!integration) {
    return null;
  }

  const expiresAt = integration.token_expires_at ? new Date(`${integration.token_expires_at}Z`).getTime() : null;

  if (expiresAt && expiresAt - Date.now() < 5 * 60 * 1000) {
    return refreshCanvasAccessToken(supabase, integration);
  }

  return integration;
}

export async function syncCanvasAssignments(supabase: SupabaseClient, userId: string) {
  const integration = await getActiveCanvasIntegration(supabase, userId);

  if (!integration?.canvas_access_token || !integration.canvas_base_url) {
    throw new Error("Connect Canvas before syncing assignments.");
  }

  const coursesUrl = new URL("/api/v1/courses", integration.canvas_base_url);
  coursesUrl.searchParams.set("enrollment_type", "student");
  coursesUrl.searchParams.set("per_page", "100");

  const courses = await fetchCanvasPaginated<CanvasCourseResponse>(coursesUrl.toString(), integration.canvas_access_token);
  const payloads = [];

  for (const course of courses) {
    const canvasCourseId = String(course.id);
    const courseName = course.name ?? course.course_code ?? "Canvas course";
    const assignmentsUrl = new URL(`/api/v1/courses/${encodeURIComponent(canvasCourseId)}/assignments`, integration.canvas_base_url);
    assignmentsUrl.searchParams.set("per_page", "100");
    assignmentsUrl.searchParams.append("include[]", "submission");

    const assignments = await fetchCanvasPaginated<CanvasAssignmentResponse>(
      assignmentsUrl.toString(),
      integration.canvas_access_token
    );

    for (const assignment of assignments) {
      const submitted =
        Boolean(assignment.submission?.submitted_at) ||
        assignment.submission?.workflow_state === "submitted" ||
        assignment.submission?.workflow_state === "graded";

      payloads.push({
        user_id: userId,
        canvas_assignment_id: String(assignment.id),
        canvas_course_id: canvasCourseId,
        course_name: courseName,
        assignment_name: assignment.name ?? "Untitled assignment",
        description: assignment.description ?? null,
        due_date: assignment.due_at ?? null,
        submitted,
        canvas_url: assignment.html_url ?? null,
        updated_at: new Date().toISOString()
      });
    }
  }

  if (payloads.length) {
    const upsertQuery = await supabase
      .from("canvas_assignments")
      .upsert(payloads, {
        onConflict: "user_id,canvas_assignment_id"
      });

    if (upsertQuery.error) {
      throw new Error(upsertQuery.error.message);
    }
  }

  const updateIntegration = await supabase
    .from("canvas_integrations")
    .update({
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", integration.id);

  if (updateIntegration.error) {
    throw new Error(updateIntegration.error.message);
  }

  return {
    synced: payloads.length,
    updated: payloads.length,
    courses: courses.map((course) => ({
      id: String(course.id),
      name: course.name ?? course.course_code ?? "Canvas course",
      courseCode: course.course_code
    }))
  };
}
