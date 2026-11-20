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

  const lockTabs = async () => {
    const selection = (tabs ?? [])
      .filter((tab) => !tab.locked && selected.includes(tab.id))
      .map(({ id, revision }) => ({ id, revision }));

    if (!selection.length || !window.confirm(t("confirm", { count: selection.length }))) return;

    setBusy(true);
    setNotice("");
    try {
      const { lockedIds } = await sendTabRequest({ action: "lock", tabs: selection });
      const lockedSet = new Set(lockedIds);
      setTabs(
        (current) =>
          current?.map((tab) => (lockedSet.has(tab.id) ? { ...tab, locked: true } : tab)) ?? null,
      );
      const skipped = selection.length - lockedIds.length;
      setNotice(
        skipped
          ? t("partial", { locked: lockedIds.length, skipped })
          : t("locked", { count: lockedIds.length }),
      );
    } catch {
      setNotice(t("lockError"));
    } finally {
      setSelected([]);
      setBusy(false);
    }
  };

  const lockedCount = (tabs ?? []).filter((tab) => tab.locked).length;
  const outlineButton =
    "rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800";

  return (
    <section
      className="mt-6 border-t border-zinc-200/80 pt-5 dark:border-zinc-800/80"
      aria-busy={busy}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t("title")}</h3>
        {lockedCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            {t("lockedBadge", { count: lockedCount })}
          </span>
        )}
      </div>
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
                className={`flex items-start gap-2.5 px-3 py-2.5 text-xs ${
                  tab.locked
                    ? "cursor-not-allowed bg-zinc-50/70 opacity-75 dark:bg-zinc-800/40"
                    : "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={tab.locked}
                  checked={Boolean(tab.locked) || selected.includes(tab.id)}
                  onChange={(event) => {
                    const checked = event.currentTarget.checked;
                    setSelected((current) =>
                      checked ? [...current, tab.id] : current.filter((id) => id !== tab.id),
                    );
                  }}
                  className="mt-0.5 size-3.5 shrink-0 accent-emerald-600"
                />
                <span className="min-w-0 flex-1">
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
                {tab.locked && (
                  <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    {t("lockedTag")}
                  </span>
                )}
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
            onClick={lockTabs}
            disabled={busy || !selected.length}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {t("lock", { count: selected.length })}
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
