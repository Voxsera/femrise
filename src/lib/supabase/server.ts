import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env, isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/env";

/** Supabase client bound to the signed-in user's session (respects RLS). */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — safe to ignore when middleware refreshes sessions.
        }
      },
    },
  });
}

/** Anonymous client for public, cacheable reads (landing page). */
export function createSupabasePublicClient() {
  if (!isSupabaseConfigured) return null;
  return createPlainClient(env.supabaseUrl, env.supabaseAnonKey, { auth: { persistSession: false } });
}

/**
 * Service-role client. Bypasses RLS — use ONLY in trusted server code
 * (payment webhooks, admin jobs). Never import into client components.
 */
export function createSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured) return null;
  return createPlainClient(env.supabaseUrl, env.supabaseServiceRoleKey, { auth: { persistSession: false } });
}
