import Link from "next/link";
import { useTranslations } from "next-intl";

export default function MultiplayerChoicePage() {
  const t = useTranslations("session");

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/session/new" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">← {t("backToModes")}</Link>
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">{t("skeleton.eyebrow")}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{t("multiplayer.title")}</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t("multiplayer.description")}</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Link href="/session/multiplayer/create" className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs hover:border-blue-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900 dark:hover:border-blue-700">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t("multiplayer.create.title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{t("multiplayer.create.description")}</p>
            <span className="mt-6 inline-flex text-xs font-semibold text-blue-700 dark:text-blue-400">{t("multiplayer.choose")} →</span>
          </Link>
          <Link href="/session/multiplayer/join" className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs hover:border-blue-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900 dark:hover:border-blue-700">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t("multiplayer.join.title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{t("multiplayer.join.description")}</p>
            <span className="mt-6 inline-flex text-xs font-semibold text-blue-700 dark:text-blue-400">{t("multiplayer.choose")} →</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
