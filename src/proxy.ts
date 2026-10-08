import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip static assets, model files, and API routes (they authenticate themselves).
    "/((?!api|_next/static|_next/image|favicon.ico|models/|mediapipe/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|tflite|wasm)$).*)",
  ],
};
