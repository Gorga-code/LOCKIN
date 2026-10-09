"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function SoloSessionPage() {
  const t = useTranslations("session");
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [websites, setWebsites] = useState<string[]>([]);

  const addWebsite = () => {
    setWebsites((current) => [...current, ""]);
  };

  const updateWebsite = (index: number, value: string) => {
    setWebsites((current) =>
      current.map((website, websiteIndex) =>
        websiteIndex === index ? value : website,
      ),
    );
  };

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-zinc-900 px-6 py-7 shadow-xs dark:bg-zinc-800 sm:px-8">
          <Link
            href="/session/new"
            className="text-xs font-medium text-zinc-400 hover:text-white"
          >
            ← {t("backToModes")}
          </Link>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {t("solo.title")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            {t("solo.description")}
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <label
              htmlFor="task-goal"
              className="text-sm font-bold text-zinc-900 dark:text-zinc-100"
            >
              {t("solo.form.goal")}
            </label>
            <input
              id="task-goal"
              type="text"
              placeholder={t("solo.form.goalPlaceholder")}
              className="mt-3 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-hidden placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-300"
            />
          </section>

          <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <label
              htmlFor="duration"
              className="text-sm font-bold text-zinc-900 dark:text-zinc-100"
            >
              {t("solo.form.duration")}
            </label>
            <select
              id="duration"
              defaultValue="25"
              className="mt-3 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-hidden focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-300"
            >
              <option value="25">{t("solo.form.durationOptions.25")}</option>
              <option value="50">{t("solo.form.durationOptions.50")}</option>
              <option value="90">{t("solo.form.durationOptions.90")}</option>
            </select>
          </section>

          <section className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {t("solo.form.camera")}
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {t("solo.form.cameraDescription")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={cameraEnabled}
              onClick={() => setCameraEnabled((enabled) => !enabled)}
              className={`relative h-7 w-12 rounded-full transition ${
                cameraEnabled
                  ? "bg-emerald-500"
                  : "bg-zinc-300 dark:bg-zinc-700"
              }`}
              aria-label={t("solo.form.camera")}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-xs transition ${
                  cameraEnabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </section>

          <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {t("solo.form.restrictions")}
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {t("solo.form.restrictionsDescription")}
                </p>
              </div>
              <button
                type="button"
                onClick={addWebsite}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-lg leading-none text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                aria-label={t("solo.form.addWebsite")}
              >
                +
              </button>
            </div>

            {websites.length === 0 ? (
              <p className="mt-5 rounded-xl border border-dashed border-zinc-300 px-4 py-5 text-center text-xs text-zinc-400 dark:border-zinc-700">
                {t("solo.form.noWebsites")}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {websites.map((website, index) => (
                  <input
                    key={index}
                    type="text"
                    value={website}
                    onChange={(event) =>
                      updateWebsite(index, event.target.value)
                    }
                    placeholder={t("solo.form.websitePlaceholder")}
                    className="block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-hidden placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-300"
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/session/new"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {t("solo.form.back")}
          </Link>
          <Link
            href="/session/active"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
          >
            {t("solo.form.start")}
          </Link>
        </div>
      </div>
    </main>
  );
}
