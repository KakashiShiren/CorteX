import type { SupabaseClient } from "@supabase/supabase-js";
import { findUniversityByEmail } from "@/lib/university";

export async function findUniversityIdByEmail(
  supabaseService: SupabaseClient,
  email: string
): Promise<string | null> {
  return (await findUniversityByEmail(supabaseService, email))?.universityId ?? null;
}
