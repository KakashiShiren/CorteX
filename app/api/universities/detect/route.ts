import { fail, ok } from "@/lib/http";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { formatUniversityName, isEduDomain, SUPPORTED_UNIVERSITY_DOMAINS } from "@/lib/university";

const supportedUniversityNames: Partial<Record<(typeof SUPPORTED_UNIVERSITY_DOMAINS)[number], string>> = {
  "clarku.edu": "Clark University",
  "northeastern.edu": "Northeastern University",
  "bu.edu": "Boston University",
  "wpi.edu": "Worcester Polytechnic Institute"
};

function localUniversityResult(domain: string) {
  return ok({
    found: true,
    name: supportedUniversityNames[domain as (typeof SUPPORTED_UNIVERSITY_DOMAINS)[number]] ?? formatUniversityName(domain)
  });
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
    const domain = searchParams.get("domain")?.trim().toLowerCase() ?? "";

    if (!isEduDomain(domain)) {
      return fail("Use a valid .edu domain.", 400);
    }

    if (!SUPPORTED_UNIVERSITY_DOMAINS.includes(domain as (typeof SUPPORTED_UNIVERSITY_DOMAINS)[number])) {
      return fail("Grove currently supports Clark, Northeastern, WPI, and Boston University emails only.", 400);
    }

    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return localUniversityResult(domain);
    }

    const query = await supabase
      .from("universities")
      .select("id, name")
      .eq("domain", domain)
      .maybeSingle();

    if (isSupabaseConnectionError(query.error)) {
      return localUniversityResult(domain);
    }

    if (query.error && query.error.code !== "PGRST116") {
      return fail(query.error.message, 500);
    }

    if (query.data) {
      return ok({
        found: true,
        name: query.data.name
      });
    }

    return ok({
      found: false,
      name: formatUniversityName(domain)
    });
  } catch (error) {
    return localUniversityResult(new URL(request.url).searchParams.get("domain")?.trim().toLowerCase() ?? "");
  }
}
