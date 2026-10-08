import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/**
 * SERVICE-ROLE client. Bypasses RLS. Server-only.
 *
 * Release 1 request handlers do NOT use this; all user data access goes through the
 * user-scoped client so RLS is always enforced. It exists for future background jobs
 * (e.g. async AI reflections) and is guarded by `server-only` + an ESLint rule.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (server-only).");
  return createClient(publicEnv.supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
