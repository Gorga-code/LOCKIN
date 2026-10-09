import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NewSessionPage() {
  const t = useTranslations("session");

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← {t("back")}
        </Link>

        <div className="mt-6 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            {t("skeleton.eyebrow")}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>

        <section className="mt-8 grid gap-5 md:grid-cols-2" aria-labelledby="session-mode-title">
          <h2 id="session-mode-title" className="sr-only">
            {t("modeSelection.title")}
          </h2>

          <Link
            href="/session/solo"
            className="group rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900 dark:hover:border-emerald-700"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl text-emerald-600 dark:text-emerald-400">
                ◉
              </div>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {t("skeleton.placeholder")}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {t("modeSelection.solo.title")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {t("modeSelection.solo.description")}
            </p>
            <span className="mt-6 inline-flex text-xs font-semibold text-emerald-700 group-hover:underline dark:text-emerald-400">
              {t("modeSelection.choose")} →
            </span>
          </Link>

          <Link
            href="/session/multiplayer"
            className="group rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900 dark:hover:border-blue-700"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl text-blue-600 dark:text-blue-400">
                ◎
              </div>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {t("skeleton.placeholder")}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {t("modeSelection.multiplayer.title")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {t("modeSelection.multiplayer.description")}
            </p>
            <span className="mt-6 inline-flex text-xs font-semibold text-blue-700 group-hover:underline dark:text-blue-400">
              {t("modeSelection.choose")} →
            </span>
          </Link>
        </section>
      </div>
    </main>
  );
}
