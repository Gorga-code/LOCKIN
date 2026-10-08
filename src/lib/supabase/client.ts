import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | undefined;

/** Browser client (anon key). Used only for auth flows; data goes through Route Handlers. */
export function createClient() {
  client ??= createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
  return client;
}
