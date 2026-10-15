import { z } from "zod";
import { handle, HttpError, json, parseJson, requireUser } from "@/lib/api/http";
import { updateSessionSchema } from "@/lib/sessions/schemas";

/** Renames a session and/or edits its note. RLS limits the update to the caller's own rows. */
export const PATCH = handle(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { supabase } = await requireUser();
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) throw new HttpError(404, "not_found");

    const body = await parseJson(req, updateSessionSchema);

    const { data, error } = await supabase
      .from("sessions")
      .update(body)
      .eq("id", id)
      .select("id, title, note")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, "not_found");

    return json(data);
  },
);
