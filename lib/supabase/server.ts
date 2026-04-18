import { createClient } from "@supabase/supabase-js";

import { env, hasSupabaseBrowserEnv, hasSupabaseServiceEnv } from "@/lib/env";

export function getSupabaseServiceClient() {
  if (!hasSupabaseServiceEnv) {
    return null;
  }

  return createClient(env.supabaseUrl!, env.supabaseServiceKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function getSupabaseAnonClient() {
  if (!hasSupabaseBrowserEnv) {
    return null;
  }

  return createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
