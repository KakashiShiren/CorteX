"use client";

import { createBrowserClient } from "@supabase/ssr";

import { env, hasSupabaseBrowserEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!hasSupabaseBrowserEnv) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(env.supabaseUrl!, env.supabaseAnonKey!);
  }

  return browserClient;
}
