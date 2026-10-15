"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useLocalCamera } from "@/lib/camera/useLocalCamera";
import { formatDuration } from "@/lib/sessions/format";
import type { RecordSessionInput } from "@/lib/sessions/schemas";

type SessionStatus = "running" | "paused" | "ended";
type SaveStatus = "saving" | "error";

type Task = {
  id: string;
  title: string;
  done: boolean;
};

const MAX_TASK_LENGTH = 200;

const formatElapsed = (ms: number) => formatDuration(Math.floor(ms / 1000));

export default function SoloSessionPage() {
  const t = useTranslations("session.solo");
  const cameraT = useTranslations("session.camera");
  const router = useRouter();
  const { videoRef, status: cameraStatus, start: startCamera, stop: stopCamera } = useLocalCamera();

  const [sessionStartedAt] = useState(() => new Date().toISOString());
  const [pauses, setPauses] = useState<RecordSessionInput["pauses"]>([]);
  const [pausedAt, setPausedAt] = useState<string | null>(null);
  const [cameraUsed, setCameraUsed] = useState(false);
  const [record, setRecord] = useState<RecordSessionInput | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saving");

  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("running");
  // Active time is accumulated across runs; pauses are excluded from the recorded time.
  const [accumulatedMs, setAccumulatedMs] = useState(0);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  const elapsedMs = accumulatedMs + (runStartedAt !== null ? now - runStartedAt : 0);

  useEffect(() => {
    if (sessionStatus !== "running") return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [sessionStatus]);

  // Remember that the camera was on at some point, even if it is turned off before stopping.
  if (cameraStatus === "ready" && !cameraUsed) setCameraUsed(true);

  useEffect(() => {
    if (sessionStatus === "ended") return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [sessionStatus]);

  const closeCurrentRun = () => {
    const stoppedAt = Date.now();
    if (runStartedAt !== null) {
      setAccumulatedMs((ms) => ms + (stoppedAt - runStartedAt));
    }
    setRunStartedAt(null);
    setNow(stoppedAt);
  };

  const pauseSession = () => {
    closeCurrentRun();
    setPausedAt(new Date().toISOString());
    setSessionStatus("paused");
  };

  const resumeSession = () => {
    const resumedAt = Date.now();
    if (pausedAt) {
      setPauses((current) => [
        ...current,
        { startedAt: pausedAt, endedAt: new Date(resumedAt).toISOString() },
      ]);
      setPausedAt(null);
    }
    setRunStartedAt(resumedAt);
    setNow(resumedAt);
    setSessionStatus("running");
  };

  const saveSession = async (payload: RecordSessionInput) => {
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Save failed with ${response.status}`);
      const { id } = (await response.json()) as { id: string };
      router.replace(`/history/${id}`);
    } catch {
      setSaveStatus("error");
    }
  };

  const stopSession = () => {
    if (!window.confirm(t("stopConfirm"))) return;
    const endedAt = new Date().toISOString();
    closeCurrentRun();
    stopCamera();
    setSessionStatus("ended");

    const payload: RecordSessionInput = {
      startedAt: sessionStartedAt,
      endedAt,
      cameraUsed,
      // A session stopped while paused closes its open pause at the end time.
      pauses: pausedAt ? [...pauses, { startedAt: pausedAt, endedAt }] : pauses,
      tasks: tasks.map(({ title, done }) => ({ title, done })),
    };
    setRecord(payload);
    void saveSession(payload);
  };

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTask.trim().slice(0, MAX_TASK_LENGTH);
    if (!title) return;
    setTasks((current) => [...current, { id: crypto.randomUUID(), title, done: false }]);
    setNewTask("");
  };

  const toggleTask = (id: string) =>
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );

  const deleteTask = (id: string) =>
    setTasks((current) => current.filter((task) => task.id !== id));

  const doneCount = tasks.filter((task) => task.done).length;

  const cameraMessage =
    cameraStatus === "denied"
      ? cameraT("permissionDenied")
      : cameraStatus === "unavailable"
        ? cameraT("unavailable")
        : t("cameraPrompt");

  if (sessionStatus === "ended") {
    return (
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-zinc-200/80 bg-white p-8 text-center shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("summary.title")}
          </h1>
          <p className="mt-6 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t("summary.recordedTime")}
          </p>
          <p className="mt-1 font-mono text-4xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatElapsed(elapsedMs)}
          </p>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
            {t("summary.tasksDone", { done: doneCount, total: tasks.length })}
          </p>
          {saveStatus === "saving" ? (
            <p className="mt-8 text-xs text-zinc-500 dark:text-zinc-400" role="status">
              {t("summary.saving")}
            </p>
          ) : (
            <div className="mt-8" role="alert">
              <p className="text-xs text-red-600 dark:text-red-400">{t("summary.saveFailed")}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => record && void saveSession(record)}
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                >
                  {t("summary.retry")}
                </button>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {t("summary.backHome")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <div className="px-2 text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {sessionStatus === "paused" ? t("timer.paused") : t("timer.label")}
              </p>
              <p
                className={`font-mono text-2xl font-bold tabular-nums ${sessionStatus === "paused" ? "text-amber-600 dark:text-amber-400" : "text-zinc-900 dark:text-zinc-50"}`}
                role="timer"
                aria-live="off"
              >
                {formatElapsed(elapsedMs)}
              </p>
            </div>
            {sessionStatus === "running" ? (
              <button
                type="button"
                onClick={pauseSession}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {t("pause")}
              </button>
            ) : (
              <button
                type="button"
                onClick={resumeSession}
                className="rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
              >
                {t("resume")}
              </button>
            )}
            <button
              type="button"
              onClick={stopSession}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              {t("stop")}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="rounded-2xl border border-zinc-200/80 bg-zinc-900 p-4 shadow-xs dark:border-zinc-800/80">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-zinc-950">
              <video
                ref={videoRef}
                className={`h-full w-full object-cover ${cameraStatus === "ready" ? "block" : "hidden"}`}
                muted
                playsInline
                aria-label={cameraT("previewLabel")}
              />
              {cameraStatus !== "ready" && (
                <div className="max-w-sm px-6 text-center text-zinc-300">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-2xl">
                    {cameraStatus === "requesting" ? "…" : "◉"}
                  </div>
                  <h2 className="text-base font-semibold text-white">{t("cameraTitle")}</h2>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">{cameraMessage}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={cameraStatus === "requesting"}
                    className="mt-4 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-zinc-950 shadow-xs hover:bg-zinc-100 disabled:opacity-50"
                  >
                    {cameraStatus === "requesting" ? cameraT("requesting") : cameraT("turnOn")}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-zinc-400">{cameraT("privacy")}</p>
              {cameraStatus === "ready" && (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-xl border border-zinc-700 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
                >
                  {cameraT("turnOff")}
                </button>
              )}
            </div>
          </section>

          <aside className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {t("tasks.title")}
              </h2>
              {tasks.length > 0 && (
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {t("tasks.progress", { done: doneCount, total: tasks.length })}
                </span>
              )}
            </div>

            <form onSubmit={addTask} className="mt-4 flex gap-2">
              <label htmlFor="new-task" className="sr-only">
                {t("tasks.inputLabel")}
              </label>
              <input
                id="new-task"
                type="text"
                maxLength={MAX_TASK_LENGTH}
                value={newTask}
                onChange={(event) => setNewTask(event.target.value)}
                placeholder={t("tasks.placeholder")}
                className="block w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
              />
              <button
                type="submit"
                disabled={!newTask.trim()}
                className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
              >
                {t("tasks.add")}
              </button>
            </form>

            {tasks.length === 0 ? (
              <p className="mt-6 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t("tasks.empty")}
              </p>
            ) : (
              <ul className="mt-4 space-y-1">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="group flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  >
                    <input
                      id={`task-${task.id}`}
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                    />
                    <label
                      htmlFor={`task-${task.id}`}
                      className={`min-w-0 flex-1 break-words text-xs ${task.done ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100"}`}
                    >
                      {task.title}
                    </label>
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      aria-label={t("tasks.delete", { title: task.title })}
                      className="shrink-0 rounded px-1.5 text-sm text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
