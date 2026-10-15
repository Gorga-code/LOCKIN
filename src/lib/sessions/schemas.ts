import { z } from "zod";

export const MAX_SESSION_TITLE = 120;
export const MAX_SESSION_NOTE = 5000;
export const MAX_TASK_TITLE = 200;

const isoDate = z.iso.datetime({ offset: true });

/** A finished solo session, sent once when the user stops it. */
export const recordSessionSchema = z.object({
  startedAt: isoDate,
  endedAt: isoDate,
  cameraUsed: z.boolean(),
  pauses: z.array(z.object({ startedAt: isoDate, endedAt: isoDate })).max(500),
  tasks: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(MAX_TASK_TITLE),
        done: z.boolean(),
      }),
    )
    .max(200),
});

export type RecordSessionInput = z.infer<typeof recordSessionSchema>;

/** Rename a session and/or edit its note. `null` clears the value. */
export const updateSessionSchema = z
  .object({
    title: z.string().trim().min(1).max(MAX_SESSION_TITLE).nullable().optional(),
    note: z
      .string()
      .max(MAX_SESSION_NOTE)
      .transform((note) => (note.trim() ? note : null))
      .nullable()
      .optional(),
  })
  .refine((body) => body.title !== undefined || body.note !== undefined, {
    message: "Nothing to update",
  });

export type UpdateSessionInput = z.input<typeof updateSessionSchema>;
