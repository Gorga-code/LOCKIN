import Link from "next/link";
import { useTranslations } from "next-intl";

export default function JoinRoomPage() {
  const t = useTranslations("session");

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/session/multiplayer" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">← {t("multiplayer.back")}</Link>
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">{t("skeleton.eyebrow")}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{t("multiplayer.join.title")}</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t("multiplayer.join.setupDescription")}</p>
        </div>
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t("multiplayer.join.previewTitle")}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["participants", "elapsed", "status"].map((item) => (
              <div key={item} className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{t(`multiplayer.join.preview.${item}.title`)}</p>
                <p className="mt-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("skeleton.placeholderValue")}</p>
              </div>
            ))}
          </div>
          <span className="mt-5 inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{t("skeleton.notActive")}</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/session/active" className="rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">{t("multiplayer.join.joinPlaceholder")}</Link>
          <Link href="/session/multiplayer" className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800">{t("skeleton.back")}</Link>
        </div>
      </div>
    </main>
  );
}
