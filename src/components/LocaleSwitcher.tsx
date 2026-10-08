"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { setLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleToggle = (nextLocale: Locale) => {
    if (nextLocale === currentLocale) return;
    startTransition(async () => {
      await setLocale(nextLocale);
      window.location.reload();
    });
  };

  return (
    <div
      role="group"
      aria-label="Language selector"
      className="inline-flex items-center rounded-lg border border-zinc-200 bg-white p-1 text-xs font-medium shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
    >
      {locales.map((loc) => {
        const isActive = loc === currentLocale;
        return (
          <button
            key={loc}
            type="button"
            disabled={isPending}
            onClick={() => handleToggle(loc)}
            className={`rounded-md px-2.5 py-1 transition-all ${
              isActive
                ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {loc === "id" ? "ID" : "EN"}
          </button>
        );
      })}
    </div>
  );
}
