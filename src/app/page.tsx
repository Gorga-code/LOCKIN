import Link from "next/link";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("landing");

  return (
    <main className="flex-1 flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8">
        {/* Subtle background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-linear-to-tr from-emerald-400 to-indigo-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {t("eyebrow")}
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl sm:leading-tight dark:text-zinc-50">
            {t("headline")}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("sub")}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-zinc-800 hover:shadow-lg dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            >
              {t("ctaStart")}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-800 shadow-xs transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-850"
            >
              {t("ctaSignIn")}
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <div className="group relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md dark:border-zinc-850 dark:bg-zinc-900/60 dark:hover:border-zinc-700">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {t("feature1Title")}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("feature1Body")}
            </p>
          </div>

          {/* Card 2 */}
          <div className="group relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md dark:border-zinc-850 dark:bg-zinc-900/60 dark:hover:border-zinc-700">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {t("feature2Title")}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("feature2Body")}
            </p>
          </div>

          {/* Card 3 */}
          <div className="group relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md dark:border-zinc-855 dark:bg-zinc-900/60 dark:hover:border-zinc-700">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {t("feature3Title")}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("feature3Body")}
            </p>
          </div>

          {/* Card 4 */}
          <div className="group relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md dark:border-zinc-850 dark:bg-zinc-900/60 dark:hover:border-zinc-700">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {t("feature4Title")}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("feature4Body")}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
