"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/env";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (password.length < 8) {
      setErrorMsg(t("errors.weakPassword"));
      return;
    }

    setLoading(true);

    try {
      if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
        throw new Error("Supabase is not configured yet. Please check .env.local.");
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setInfoMsg(t("checkEmail"));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("errors.generic");
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("signUpTitle")}
          </h2>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {t("haveAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              {t("signInButton")}
            </Link>
          </p>
        </div>

        {infoMsg && (
          <div
            role="status"
            className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
          >
            {infoMsg}
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@kampus.ac.id"
              className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 shadow-xs focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              {t("password")}
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 shadow-xs focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
            />
            <p className="mt-1 text-[11px] text-zinc-500">{t("passwordHint")}</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
          >
            {loading ? "..." : t("signUpButton")}
          </button>
        </form>
      </div>
    </div>
  );
}
