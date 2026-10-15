import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/sessions/format";
import { SessionNoteEditor, SessionTitleEditor } from "./SessionEditors";

type SessionDetail = {
  id: string;
  title: string | null;
  note: string | null;
  started_at: string;
  ended_at: string | null;
  active_elapsed_seconds: number;
  camera_mode: "on" | "off";
  session_pauses: { started_at: string; ended_at: string | null }[];
  session_tasks: { id: string; title: string; done: boolean; position: number }[];
};

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const t = await getTranslations("history");
  const format = await getFormatter();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, title, note, started_at, ended_at, active_elapsed_seconds, camera_mode, session_pauses(started_at, ended_at), session_tasks(id, title, done, position)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();
  const session = data as SessionDetail;

  const tasks = [...session.session_tasks].sort((a, b) => a.position - b.position);
  const doneCount = tasks.filter((task) => task.done).length;
  const pausedSeconds = session.session_pauses.reduce(
    (total, pause) =>
      pause.ended_at
        ? total + Math.floor((Date.parse(pause.ended_at) - Date.parse(pause.started_at)) / 1000)
        : total,
    0,
  );
  const dateTime = (iso: string) =>
    format.dateTime(new Date(iso), { dateStyle: "full", timeStyle: "short" });

  const stats = [
    {
      label: t("detail.recordedTime"),
      value: formatDuration(session.active_elapsed_seconds),
      mono: true,
    },
    {
      label: t("detail.pauses"),
      value: t("detail.pausesValue", {
        count: session.session_pauses.length,
        duration: formatDuration(pausedSeconds),
      }),
    },
    { label: t("detail.started"), value: dateTime(session.started_at) },
    { label: t("detail.ended"), value: session.ended_at ? dateTime(session.ended_at) : "—" },
  ];

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/history"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← {t("detail.back")}
        </Link>

        <div className="mt-4">
          <SessionTitleEditor sessionId={session.id} title={session.title} />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {session.camera_mode === "on" ? t("detail.cameraOn") : t("detail.cameraOff")}
          </p>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900"
            >
              <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {stat.label}
              </dt>
              <dd
                className={`mt-1 text-zinc-900 dark:text-zinc-50 ${stat.mono ? "font-mono text-2xl font-bold tabular-nums" : "text-sm font-semibold"}`}
              >
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          {t("detail.disclaimer")}
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {t("detail.tasks")}
              </h2>
              {tasks.length > 0 && (
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {t("taskCount", { done: doneCount, total: tasks.length })}
                </span>
              )}
            </div>
            {tasks.length === 0 ? (
              <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">{t("detail.noTasks")}</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-3 text-xs">
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${task.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-300 dark:border-zinc-700"}`}
                    >
                      {task.done ? "✓" : ""}
                    </span>
                    <span
                      className={`min-w-0 break-words ${task.done ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100"}`}
                    >
                      <span className="sr-only">
                        {task.done ? t("detail.taskDone") : t("detail.taskNotDone")}:{" "}
                      </span>
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {t("detail.note")}
            </h2>
            <SessionNoteEditor sessionId={session.id} note={session.note} />
          </section>
        </div>
      </div>
    </main>
  );
}
