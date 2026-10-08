import "server-only";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { createClient, type ServerSupabase } from "@/lib/supabase/server";

export type AuthedContext = { supabase: ServerSupabase; userId: string };

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

/**
 * Resolves the user from the auth cookie. The user ID is ALWAYS taken from the verified
 * session, never from the request body or query string.
 */
export async function requireUser(): Promise<AuthedContext> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new HttpError(401, "unauthorized");
  return { supabase, userId: data.user.id };
}

export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "invalid_json");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(422, "validation_failed", result.error.issues[0]?.message);
  }
  return result.data;
}

export function json<T>(data: T, init?: number | ResponseInit) {
  const resInit = typeof init === "number" ? { status: init } : init;
  return NextResponse.json(data, {
    ...resInit,
    headers: { "Cache-Control": "private, no-store", ...(resInit?.headers ?? {}) },
  });
}

/** Wraps a route handler: maps HttpError to JSON responses and hides internal errors. */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return json({ error: err.code, message: err.message }, err.status);
      }
      console.error("[api] unexpected error", err);
      return json({ error: "internal_error" }, 500);
    }
  };
}
