import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { createAdminClient } from "@/lib/supabase/admin";
import { env, hasSupabaseBrowserEnv } from "@/lib/env";

export function createClient() {
  if (!hasSupabaseBrowserEnv) {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components cannot set cookies. Route handlers and middleware can.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Server Components cannot set cookies. Route handlers and middleware can.
        }
      }
    }
  });
}

export function getSupabaseAnonClient() {
  if (!hasSupabaseBrowserEnv) {
    return null;
  }

  return createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    cookies: {
      get() {
        return undefined;
      },
      set() {},
      remove() {}
    }
  });
}

export const getSupabaseServerClient = createClient;
export const getSupabaseServiceClient = createAdminClient;
