import { useTranslations } from "next-intl";

export default function CoachPage() {
  const t = useTranslations("coach");

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-200/80 bg-white p-8 text-center shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
          <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          {t("badge")}
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {t("body")}
        </p>

        <div className="mt-6 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 text-left text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
          <div className="flex items-start gap-2.5">
            <span className="text-emerald-600 font-bold dark:text-emerald-400">✓</span>
            <p>{t("privacy")}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
