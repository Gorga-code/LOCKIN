/**
 * Public (browser-safe) environment values. Server-only secrets live in
 * `src/lib/supabase/admin.ts` and are never referenced from here.
 */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  appOrigin: process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000",
  googleAuthEnabled: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true",
  extensionId: process.env.NEXT_PUBLIC_EXTENSION_ID ?? "",
} as const;

export function assertSupabaseEnv() {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. See .env.example.",
    );
  }
}
