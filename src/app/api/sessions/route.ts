import { handle, HttpError, json, parseJson, requireUser } from "@/lib/api/http";
import { recordSessionSchema } from "@/lib/sessions/schemas";

const MAX_SESSION_MS = 24 * 60 * 60 * 1000;
const CLOCK_SKEW_MS = 60 * 1000;

/**
 * Records a finished solo session with its pauses and tasks. Active time is derived here from
 * the timestamps (span minus pauses); the client's own timer value is not trusted.
 */
export const POST = handle(async (req: Request) => {
  const { supabase, userId } = await requireUser();
  const body = await parseJson(req, recordSessionSchema);

  const startedAt = Date.parse(body.startedAt);
  const endedAt = Date.parse(body.endedAt);
  if (endedAt < startedAt || endedAt - startedAt > MAX_SESSION_MS) {
    throw new HttpError(422, "invalid_session_span");
  }
  if (endedAt > Date.now() + CLOCK_SKEW_MS) {
    throw new HttpError(422, "session_in_future");
  }

  const pauses = body.pauses
    .map((p) => ({ start: Date.parse(p.startedAt), end: Date.parse(p.endedAt) }))
    .sort((a, b) => a.start - b.start);
  let pausedMs = 0;
  let previousEnd = startedAt;
  for (const pause of pauses) {
    if (pause.start < previousEnd || pause.end < pause.start || pause.end > endedAt) {
      throw new HttpError(422, "invalid_pauses");
    }
    pausedMs += pause.end - pause.start;
    previousEnd = pause.end;
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      user_id: userId,
      status: "completed",
      camera_mode: body.cameraUsed ? "on" : "off",
      started_at: new Date(startedAt).toISOString(),
      ended_at: new Date(endedAt).toISOString(),
      active_elapsed_seconds: Math.floor((endedAt - startedAt - pausedMs) / 1000),
      last_resumed_at: null,
    })
    .select("id")
    .single();
  if (error || !session) throw error ?? new Error("session insert returned no row");

  const children = await Promise.all([
    pauses.length
      ? supabase.from("session_pauses").insert(
          pauses.map((p) => ({
            session_id: session.id,
            user_id: userId,
            kind: "pause",
            started_at: new Date(p.start).toISOString(),
            ended_at: new Date(p.end).toISOString(),
          })),
        )
      : null,
    body.tasks.length
      ? supabase.from("session_tasks").insert(
          body.tasks.map((task, position) => ({
            session_id: session.id,
            user_id: userId,
            title: task.title,
            done: task.done,
            position,
          })),
        )
      : null,
  ]);

  const childError = children.find((result) => result?.error)?.error;
  if (childError) {
    // Children cascade, so removing the session undoes the partial write.
    await supabase.from("sessions").delete().eq("id", session.id);
    throw childError;
  }

  return json({ id: session.id }, 201);
});
