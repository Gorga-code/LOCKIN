import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/sessions/format";

type HistoryRow = {
  id: string;
  title: string | null;
  started_at: string;
  active_elapsed_seconds: number;
  session_pauses: { count: number }[];
  session_tasks: { done: boolean }[];
};

export default async function HistoryPage() {
  const t = await getTranslations("history");
  const format = await getFormatter();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, title, started_at, active_elapsed_seconds, session_pauses(count), session_tasks(done)",
    )
    .in("status", ["completed", "early_exit"])
    .order("started_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  const sessions = (data ?? []) as HistoryRow[];

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("empty")}</p>
            <Link
              href="/session/new"
              className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            >
              {t("startSession")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {sessions.map((session) => {
              const doneCount = session.session_tasks.filter((task) => task.done).length;
              return (
                <li key={session.id}>
                  <Link
                    href={`/history/${session.id}`}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {session.title ?? t("untitled")}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {format.dateTime(new Date(session.started_at), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-right text-xs text-zinc-500 dark:text-zinc-400">
                      <span>
                        {t("taskCount", { done: doneCount, total: session.session_tasks.length })}
                      </span>
                      <span>
                        {t("pauseCount", { count: session.session_pauses[0]?.count ?? 0 })}
                      </span>
                      <span className="font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {formatDuration(session.active_elapsed_seconds)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
