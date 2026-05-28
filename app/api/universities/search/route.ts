import { fail, ok } from "@/lib/http";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { formatUniversityName, SUPPORTED_UNIVERSITY_DOMAINS } from "@/lib/university";

type UniversityRow = {
  id: string;
  name: string;
  domain: string;
};

const localUniversities: UniversityRow[] = SUPPORTED_UNIVERSITY_DOMAINS.map((domain) => ({
  id: domain,
  name: formatUniversityName(domain),
  domain
}));

function searchLocalUniversities(query: string) {
  const normalizedQuery = query.toLowerCase();

  return localUniversities.filter(
    (university) =>
      university.name.toLowerCase().includes(normalizedQuery) ||
      university.domain.toLowerCase().includes(normalizedQuery)
  );
}

function isSupabaseConnectionError(error: { message?: string; code?: string } | null | undefined) {
  const message = `${error?.message ?? ""} ${error?.code ?? ""}`.toLowerCase();

  return (
    message.includes("fetch failed") ||
    message.includes("enotfound") ||
    message.includes("econnrefused") ||
    message.includes("network")
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";

    if (!query) {
      return ok({
        universities: [] as UniversityRow[]
      });
    }

    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return ok({
        universities: searchLocalUniversities(query)
      });
    }

    const [nameMatches, domainMatches] = await Promise.all([
      supabase.from("universities").select("id, name, domain").ilike("name", `%${query}%`).limit(8),
      supabase.from("universities").select("id, name, domain").ilike("domain", `%${query}%`).limit(8)
    ]);

    if (isSupabaseConnectionError(nameMatches.error) || isSupabaseConnectionError(domainMatches.error)) {
      return ok({
        universities: searchLocalUniversities(query)
      });
    }

    if (nameMatches.error) {
      return fail(nameMatches.error.message, 500);
    }

    if (domainMatches.error) {
      return fail(domainMatches.error.message, 500);
    }

    const universities = [...(nameMatches.data ?? []), ...(domainMatches.data ?? [])].reduce<UniversityRow[]>(
      (results, university) => {
        if (!results.some((item) => item.id === university.id)) {
          results.push(university);
        }

        return results;
      },
      []
    );

    return ok({
      universities: universities.slice(0, 8)
    });
  } catch (error) {
    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

    return ok({
      universities: searchLocalUniversities(query)
    });
  }
}
