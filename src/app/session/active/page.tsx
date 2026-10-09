"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { startTransition } from "react";
import { useTranslations } from "next-intl";

type CameraStatus = "off" | "requesting" | "ready" | "denied" | "unavailable";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export default function ActiveSessionPage() {
  const t = useTranslations("session");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("off");
  const [isStarted, setIsStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionDetails, setSessionDetails] = useState({
    duration: "25",
    notes: "",
    title: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    startTransition(() => {
      setSessionDetails({
        duration: params.get("duration") || "25",
        notes: params.get("notes") || "",
        title: params.get("title") || t("active.untitled"),
      });
    });
  }, [t]);

  useEffect(() => {
    if (!isStarted) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isStarted]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const toggleCamera = async () => {
    if (cameraStatus === "ready" || cameraStatus === "requesting") {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraStatus("off");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unavailable");
      return;
    }

    setCameraStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus("ready");
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraStatus(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "denied"
          : "unavailable",
      );
    }
  };

  const cameraMessage =
    cameraStatus === "denied"
      ? t("active.cameraDenied")
      : cameraStatus === "unavailable"
        ? t("active.cameraUnavailable")
        : t("active.cameraDescription");

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl bg-zinc-900 px-6 py-7 shadow-xs dark:bg-zinc-800 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            {t("active.eyebrow")}
          </p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {sessionDetails.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            {sessionDetails.notes || t("active.noNotes")}
          </p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="rounded-2xl border border-zinc-200/80 bg-zinc-900 p-4 shadow-xs dark:border-zinc-800/80">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-zinc-950">
              <video
                ref={videoRef}
                className={`h-full w-full object-cover ${cameraStatus === "ready" ? "block" : "hidden"}`}
                muted
                playsInline
                aria-label={t("active.cameraPlaceholder")}
              />
              {cameraStatus !== "ready" && (
                <div className="px-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-2xl text-zinc-400">
                    ◉
                  </div>
                  <p className="mt-4 text-sm font-semibold text-white">
                    {t("active.cameraPlaceholder")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{cameraMessage}</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-zinc-400">{t("active.privacy")}</p>
              <button
                type="button"
                onClick={toggleCamera}
                disabled={cameraStatus === "requesting"}
                className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-100 disabled:opacity-50"
              >
                {cameraStatus === "ready"
                  ? t("active.cameraOff")
                  : cameraStatus === "requesting"
                    ? t("active.cameraRequesting")
                    : t("active.cameraOn")}
              </button>
            </div>
          </section>

          <aside className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              {t("active.timerLabel")}
            </p>
            <p className="mt-3 text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatTime(elapsedSeconds)}
            </p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {t("active.plannedDuration", { minutes: sessionDetails.duration })}
            </p>
            <span className="mt-4 inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
              {isStarted ? t("active.startedBadge") : t("active.previewBadge")}
            </span>
            {!isStarted && (
              <button
                type="button"
                onClick={() => setIsStarted(true)}
                className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
              >
                {t("active.start")}
              </button>
            )}
          </aside>
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            href="/session/solo"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {t("active.back")}
          </Link>
        </div>
      </div>
    </main>
  );
}
