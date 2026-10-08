import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LOCKIN — Focus & Accountability",
  description:
    "Turn study intentions into structured work sessions with task goals, local computer vision reminders, and allowlists.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  let userEmail: string | null = null;
  if (publicEnv.supabaseUrl && publicEnv.supabaseAnonKey) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      userEmail = data.user?.email ?? null;
    } catch {
      // Offline / not connected yet
    }
  }

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navbar userEmail={userEmail} />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
