"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  MAX_SESSION_NOTE,
  MAX_SESSION_TITLE,
  type UpdateSessionInput,
} from "@/lib/sessions/schemas";

type SaveState = "idle" | "saving" | "saved" | "error";

async function updateSession(sessionId: string, body: UpdateSessionInput) {
  const response = await fetch(`/api/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Update failed with ${response.status}`);
}

export function SessionTitleEditor({
  sessionId,
  title,
}: {
  sessionId: string;
  title: string | null;
}) {
  const t = useTranslations("history");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title ?? "");
  const [state, setState] = useState<SaveState>("idle");

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = draft.trim();
    setState("saving");
    try {
      await updateSession(sessionId, { title: next || null });
      setState("idle");
      setEditing(false);
      router.refresh();
    } catch {
      setState("error");
    }
  };

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="break-words text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title ?? t("untitled")}
        </h1>
        <button
          type="button"
          onClick={() => {
            setDraft(title ?? "");
            setEditing(true);
          }}
          className="rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {t("detail.rename")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-2">
      <label htmlFor="session-title" className="sr-only">
        {t("detail.nameLabel")}
      </label>
      <input
        id="session-title"
        type="text"
        autoFocus
        maxLength={MAX_SESSION_TITLE}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={t("untitled")}
        className="block w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
      />
      <button
        type="submit"
        disabled={state === "saving"}
        className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
      >
        {state === "saving" ? t("detail.saving") : t("detail.save")}
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setState("idle");
        }}
        className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {t("detail.cancel")}
      </button>
      {state === "error" && (
        <p className="w-full text-xs text-red-600 dark:text-red-400" role="alert">
          {t("detail.saveFailed")}
        </p>
      )}
    </form>
  );
}

export function SessionNoteEditor({ sessionId, note }: { sessionId: string; note: string | null }) {
  const t = useTranslations("history");
  const router = useRouter();
  const [draft, setDraft] = useState(note ?? "");
  const [state, setState] = useState<SaveState>("idle");
  const dirty = draft !== (note ?? "");

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("saving");
    try {
      await updateSession(sessionId, { note: draft });
      setState("saved");
      router.refresh();
    } catch {
      setState("error");
    }
  };

  return (
    <form onSubmit={save} className="mt-4">
      <label htmlFor="session-note" className="sr-only">
        {t("detail.note")}
      </label>
      <textarea
        id="session-note"
        rows={8}
        maxLength={MAX_SESSION_NOTE}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setState("idle");
        }}
        placeholder={t("detail.notePlaceholder")}
        className="block w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs leading-relaxed text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
      />
      <div className="mt-3 flex items-center justify-end gap-3">
        {state === "saved" && !dirty && (
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400" role="status">
            {t("detail.saved")}
          </span>
        )}
        {state === "error" && (
          <span className="text-[11px] text-red-600 dark:text-red-400" role="alert">
            {t("detail.saveFailed")}
          </span>
        )}
        <button
          type="submit"
          disabled={!dirty || state === "saving"}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
        >
          {state === "saving" ? t("detail.saving") : t("detail.saveNote")}
        </button>
      </div>
    </form>
  );
}
