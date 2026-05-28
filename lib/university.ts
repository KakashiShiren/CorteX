import type { SupabaseClient } from "@supabase/supabase-js";

export const UNIVERSITY_EMAIL_ERROR =
  "Please use a valid .edu university email.";

export const TEST_EMAILS = [
  "cortextest1@gmail.com",
  "cortextest2@gmail.com",
  "cortextest3@gmail.com",
  "cortextest4@gmail.com",
  "cortextest5@gmail.com"
] as const;

export const LEGACY_TEST_EMAILS = [
  "cortextest1@clarku.edu",
  "cortextest2@clarku.edu",
  "cortextest3@clarku.edu"
] as const;

export const ALL_TEST_EMAILS = [...TEST_EMAILS, ...LEGACY_TEST_EMAILS] as const;

const testEmailSet = new Set<string>(ALL_TEST_EMAILS);
const knownUniversityNames: Record<string, string> = {
  "clarku.edu": "Clark University",
  "northeastern.edu": "Northeastern University",
  "bu.edu": "Boston University",
  "wpi.edu": "Worcester Polytechnic Institute"
};

export const SUPPORTED_UNIVERSITY_DOMAINS = [
  "clarku.edu",
  "northeastern.edu",
  "wpi.edu",
  "bu.edu"
] as const;

const supportedUniversityDomainSet = new Set<string>(SUPPORTED_UNIVERSITY_DOMAINS);

export function normalizeUniversityEmail(email: string) {
  return email.trim().toLowerCase();
}

export function extractEmailDomain(email: string) {
  const normalized = normalizeUniversityEmail(email);
  const [, domain] = normalized.split("@");
  return domain ?? null;
}

export function isEduDomain(domain: string | null | undefined) {
  return Boolean(domain && domain.toLowerCase().endsWith(".edu"));
}

export function isTestEmail(email: string) {
  return testEmailSet.has(normalizeUniversityEmail(email));
}

export function isAllowedUniversityEmail(email: string) {
  const normalized = normalizeUniversityEmail(email);

  if (isTestEmail(normalized)) {
    return true;
  }

  const domain = extractEmailDomain(normalized);
  return isEduDomain(domain);
}

export function formatUniversityName(domain: string): string {
  const normalizedDomain = domain.trim().toLowerCase();

  if (knownUniversityNames[normalizedDomain]) {
    return knownUniversityNames[normalizedDomain];
  }

  const base = normalizedDomain.replace(/\.edu$/, "");
  const parts = base.split(/[.\-]/).filter(Boolean);
  const capitalized = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .trim();

  if (!capitalized) {
    return "Your University";
  }

  if (
    capitalized.toLowerCase().includes("university") ||
    capitalized.toLowerCase().includes("college") ||
    capitalized.toLowerCase().includes("institute")
  ) {
    return capitalized;
  }

  return `${capitalized} University`;
}

async function getUniversityByDomain(supabaseServiceClient: SupabaseClient, domain: string) {
  const query = await supabaseServiceClient
    .from("universities")
    .select("id, name, domain")
    .eq("domain", domain)
    .maybeSingle();

  if (query.error && query.error.code !== "PGRST116") {
    throw new Error(query.error.message);
  }

  return query.data ?? null;
}

export async function detectOrCreateUniversity(
  email: string,
  supabaseServiceClient: SupabaseClient
): Promise<{ universityId: string; universityName: string; universityDomain: string }> {
  const normalizedEmail = normalizeUniversityEmail(email);
  const domain = isTestEmail(normalizedEmail) ? "clarku.edu" : extractEmailDomain(normalizedEmail);

  if (!domain) {
    throw new Error("A valid university email is required.");
  }

  const existing = await getUniversityByDomain(supabaseServiceClient, domain);

  if (existing) {
    return {
      universityId: existing.id,
      universityName: existing.name,
      universityDomain: existing.domain
    };
  }

  const insertQuery = await supabaseServiceClient
    .from("universities")
    .insert({
      name: formatUniversityName(domain),
      domain,
      is_active: true
    })
    .select("id, name, domain")
    .single();

  if (insertQuery.error || !insertQuery.data) {
    const fallback = await getUniversityByDomain(supabaseServiceClient, domain);
    if (fallback) {
      return {
        universityId: fallback.id,
        universityName: fallback.name,
        universityDomain: fallback.domain
      };
    }

    throw new Error("Failed to create university");
  }

  return {
    universityId: insertQuery.data.id,
    universityName: insertQuery.data.name,
    universityDomain: insertQuery.data.domain
  };
}

export async function findUniversityByEmail(
  supabaseServiceClient: SupabaseClient,
  email: string
): Promise<{ universityId: string; universityName: string; universityDomain: string } | null> {
  const normalizedEmail = normalizeUniversityEmail(email);
  const domain = isTestEmail(normalizedEmail) ? "clarku.edu" : extractEmailDomain(normalizedEmail);

  if (!domain) {
    return null;
  }

  const existing = await getUniversityByDomain(supabaseServiceClient, domain);

  if (!existing) {
    return null;
  }

  return {
    universityId: existing.id,
    universityName: existing.name,
    universityDomain: existing.domain
  };
}

export async function getCurrentUserUniversityId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const query = await supabase.from("users").select("university_id").eq("id", userId).single();

  if (query.error) {
    throw new Error(query.error.message);
  }

  return query.data?.university_id ?? null;
}

export async function getCurrentUserUniversity(
  supabase: SupabaseClient,
  userId: string
): Promise<{ universityId: string | null; universityName: string | null; universityDomain: string | null }> {
  const universityId = await getCurrentUserUniversityId(supabase, userId);

  if (!universityId) {
    return {
      universityId: null,
      universityName: null,
      universityDomain: null
    };
  }

  const universityQuery = await supabase
    .from("universities")
    .select("id, name, domain")
    .eq("id", universityId)
    .maybeSingle();

  if (universityQuery.error && universityQuery.error.code !== "PGRST116") {
    throw new Error(universityQuery.error.message);
  }

  return {
    universityId,
    universityName: universityQuery.data?.name ?? null,
    universityDomain: universityQuery.data?.domain ?? null
  };
}
