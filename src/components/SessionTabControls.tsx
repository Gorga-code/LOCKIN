"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { sendTabRequest, type OpenTab } from "@/lib/extension/tabs";

export function SessionTabControls() {
  const t = useTranslations("session.extension");
  const [tabs, setTabs] = useState<OpenTab[] | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const loadTabs = async () => {
    setBusy(true);
    setNotice("");
    try {
      setTabs(await sendTabRequest({ action: "list" }));
    } catch {
      setTabs(null);
      setNotice(t("unavailable"));
    } finally {
      setSelected([]);
      setBusy(false);
    }
  };

  const closeTabs = async () => {
    const selection = (tabs ?? [])
      .filter((tab) => selected.includes(tab.id))
      .map(({ id, revision }) => ({ id, revision }));

    if (!selection.length || !window.confirm(t("confirm", { count: selection.length }))) return;

    setBusy(true);
    setNotice("");
    try {
      const closedIds = await sendTabRequest({ action: "close", tabs: selection });
      setTabs((current) => current?.filter((tab) => !closedIds.includes(tab.id)) ?? null);
      const skipped = selection.length - closedIds.length;
      setNotice(
        skipped
          ? t("partial", { closed: closedIds.length, skipped })
          : t("closed", { count: closedIds.length }),
      );
    } catch {
      setNotice(t("closeError"));
    } finally {
      setSelected([]);
      setBusy(false);
    }
  };

  const outlineButton =
    "rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800";

  return (
    <section
      className="mt-6 border-t border-zinc-200/80 pt-5 dark:border-zinc-800/80"
      aria-busy={busy}
    >
      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t("title")}</h3>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        {t("description")}
      </p>

      {tabs === null && (
        <details className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
          <summary className="cursor-pointer font-medium text-zinc-800 dark:text-zinc-200">
            {t("install")}
          </summary>
          <p className="mt-2 leading-relaxed">
            {t.rich("installSteps", { code: (value) => <code>{value}</code> })}
          </p>
        </details>
      )}

      {tabs !== null &&
        (tabs.length ? (
          <fieldset
            disabled={busy}
            className="mt-3 max-h-52 min-w-0 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800"
          >
            <legend className="sr-only">{t("tabList")}</legend>
            {tabs.map((tab) => (
              <label
                key={tab.id}
                className="flex cursor-pointer items-start gap-2.5 px-3 py-2.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(tab.id)}
                  onChange={(event) => {
                    const checked = event.currentTarget.checked;
                    setSelected((current) =>
                      checked ? [...current, tab.id] : current.filter((id) => id !== tab.id),
                    );
                  }}
                  className="mt-0.5 size-3.5 shrink-0 accent-emerald-600"
                />
                <span className="min-w-0">
                  <span
                    className="block truncate font-medium text-zinc-900 dark:text-zinc-100"
                    title={tab.title}
                  >
                    {tab.title || tab.site || t("untitled")}
                  </span>
                  {tab.site && tab.site !== tab.title && (
                    <span className="block truncate text-zinc-500 dark:text-zinc-400">
                      {tab.site}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </fieldset>
        ) : (
          <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">{t("empty")}</p>
        ))}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={loadTabs} disabled={busy} className={outlineButton}>
          {tabs === null ? t("connect") : t("refresh")}
        </button>
        {tabs !== null && tabs.length > 0 && (
          <button
            type="button"
            onClick={closeTabs}
            disabled={busy || !selected.length}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {t("close", { count: selected.length })}
          </button>
        )}
      </div>
      <p
        role="status"
        className="mt-2 text-xs leading-relaxed text-zinc-600 empty:mt-0 dark:text-zinc-400"
      >
        {busy ? t("working") : notice}
      </p>
    </section>
  );
}
