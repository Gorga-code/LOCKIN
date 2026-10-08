import Link from "next/link";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {t("greeting")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start Session Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {t("startCta")}
          </h2>
          <p className="mt-2 text-xs text-zinc-500 leading-relaxed dark:text-zinc-400">
            Tetapkan target tugas belajar dan durasi sesi. Kamera dan ekstensi Chrome akan melindungimu dari distraksi.
          </p>
          <div className="mt-6">
            <Link
              href="/session/new"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            >
              {t("startCta")} →
            </Link>
          </div>
        </div>

        {/* History Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {t("historyCta")}
          </h2>
          <p className="mt-2 text-xs text-zinc-500 leading-relaxed dark:text-zinc-400">
            Tinjau catatan durasi sesi, jeda, pengingat wajah/ponsel, dan refleksi pencapaian targetmu.
          </p>
          <div className="mt-6">
            <Link
              href="/history"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800 shadow-xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-850 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {t("historyCta")} →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
