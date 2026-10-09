"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function RoomLobbyPage() {
  const t = useTranslations("session");
  const params = useSearchParams();
  const roomName = params.get("roomName") || t("multiplayer.room.untitled");
  const capacity = params.get("capacity") || "2";
  const duration = params.get("duration") || "25";
  const goal = params.get("goal") || t("multiplayer.room.noGoal");

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/session/multiplayer/create" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          ← {t("multiplayer.room.back")}
        </Link>
        <div className="mt-6 rounded-2xl bg-zinc-900 px-6 py-7 shadow-xs dark:bg-zinc-800 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">{t("multiplayer.room.eyebrow")}</p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{roomName}</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">{t("multiplayer.room.description")}</p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("multiplayer.room.participants")}</p>
            <p className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">1 / {capacity}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("multiplayer.room.duration")}</p>
            <p className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">{duration} {t("multiplayer.room.minutes")}</p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("multiplayer.room.goal")}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{goal}</p>
          <span className="mt-5 inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">{t("multiplayer.room.placeholderBadge")}</span>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/session/multiplayer/create" className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800">{t("multiplayer.room.leave")}</Link>
          <button type="button" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700">{t("multiplayer.room.start")}</button>
        </div>
      </div>
    </main>
  );
}
