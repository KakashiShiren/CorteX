import { createClient } from "@supabase/supabase-js";

import { env, hasSupabaseServiceEnv } from "@/lib/env";

export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("Supabase admin client cannot be used in the browser.");
  }

  if (!hasSupabaseServiceEnv) {
    return null;
  }

  return createClient(env.supabaseUrl!, env.supabaseServiceRoleKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export const getSupabaseServiceClient = createAdminClient;
