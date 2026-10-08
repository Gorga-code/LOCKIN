"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

interface NavbarProps {
  userEmail?: string | null;
}

export function Navbar({ userEmail }: NavbarProps) {
  const t = useTranslations("nav");
  const commonT = useTranslations("common");
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: t("dashboard"), protected: true },
    { href: "/session/new", label: t("newSession"), protected: true },
    { href: "/history", label: t("history"), protected: true },
    { href: "/coach", label: t("coach"), badge: commonT("comingSoon"), protected: false },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white font-bold tracking-wider shadow-sm transition-transform group-hover:scale-105 dark:bg-white dark:text-zinc-950">
              L
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 text-base leading-tight">
                LOCKIN
              </span>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                FOCUS & PRIVACY
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav aria-label={t("label")} className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-zinc-950 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-900"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  {link.label}
                  {link.badge && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />

          {userEmail ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]">
                {userEmail}
              </span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  {t("signOut")}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              >
                {t("signIn")}
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
              >
                {t("signUp")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
