"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function CreateRoomPage() {
  const t = useTranslations("session");
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("25");

  const createRoom = () => {
    const params = new URLSearchParams({ capacity, duration, goal, roomName });
    router.push(`/session/multiplayer/room?${params.toString()}`);
  };

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/session/multiplayer"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← {t("multiplayer.back")}
        </Link>
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            {t("skeleton.eyebrow")}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("multiplayer.create.title")}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {t("multiplayer.create.setupDescription")}
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <label htmlFor="room-name" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {t("multiplayer.create.fields.roomName.title")}
            </label>
            <input
              id="room-name"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder={t("multiplayer.create.fields.roomName.placeholder")}
              className="mt-3 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-hidden placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-300"
            />
          </section>

          <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <label htmlFor="capacity" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {t("multiplayer.create.fields.capacity.title")}
            </label>
            <select
              id="capacity"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              className="mt-3 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-hidden focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-300"
            >
              <option value="2">{t("multiplayer.create.fields.capacity.options.2")}</option>
              <option value="3">{t("multiplayer.create.fields.capacity.options.3")}</option>
              <option value="4">{t("multiplayer.create.fields.capacity.options.4")}</option>
              <option value="5">{t("multiplayer.create.fields.capacity.options.5")}</option>
            </select>
          </section>

          <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <label htmlFor="room-goal" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {t("multiplayer.create.fields.goal.title")}
            </label>
            <textarea
              id="room-goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder={t("multiplayer.create.fields.goal.placeholder")}
              rows={5}
              className="mt-3 block w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-hidden placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-300"
            />
          </section>

          <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <label htmlFor="room-duration" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {t("multiplayer.create.fields.duration.title")}
            </label>
            <select
              id="room-duration"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="mt-3 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-hidden focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-300"
            >
              <option value="25">{t("multiplayer.create.fields.duration.options.25")}</option>
              <option value="50">{t("multiplayer.create.fields.duration.options.50")}</option>
              <option value="90">{t("multiplayer.create.fields.duration.options.90")}</option>
            </select>
          </section>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/session/multiplayer" className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800">
            {t("skeleton.back")}
          </Link>
          <button type="button" onClick={createRoom} className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700">
            {t("multiplayer.create.createButton")}
          </button>
        </div>
      </div>
    </main>
  );
}
