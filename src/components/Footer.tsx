import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("landing");
  const commonT = useTranslations("common");

  return (
    <footer className="w-full border-t border-zinc-200/80 bg-zinc-50/50 py-8 text-xs text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <p className="font-semibold text-zinc-800 dark:text-zinc-200">
            {commonT("appName")} — Focus & Accountability
          </p>
          <p className="max-w-md text-center text-[11px] text-zinc-500 sm:text-left dark:text-zinc-400">
            {t("disclaimer")}
          </p>
        </div>
        <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Privacy-by-design: 100% On-device local computer vision.
        </div>
      </div>
    </footer>
  );
}
