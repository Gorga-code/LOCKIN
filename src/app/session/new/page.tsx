"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type CameraStatus = "idle" | "requesting" | "ready" | "denied" | "unavailable";

export default function NewSessionPage() {
  const t = useTranslations("session");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [region, setRegion] = useState("");
  const [displayName, setDisplayName] = useState("");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus("idle");
  };

  const startCamera = async () => {
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

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const cameraMessage =
    cameraStatus === "denied"
      ? t("camera.permissionDenied")
      : cameraStatus === "unavailable"
        ? t("camera.unavailable")
        : t("camera.description");

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← {t("back")}
          </Link>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="rounded-2xl border border-zinc-200/80 bg-zinc-900 p-4 shadow-xs dark:border-zinc-800/80">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-zinc-950">
              <video
                ref={videoRef}
                className={`h-full w-full object-cover ${cameraStatus === "ready" ? "block" : "hidden"}`}
                muted
                playsInline
                aria-label={t("camera.previewLabel")}
              />
              {cameraStatus !== "ready" && (
                <div className="max-w-sm px-6 text-center text-zinc-300">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-2xl">
                    {cameraStatus === "requesting" ? "…" : "◉"}
                  </div>
                  <h2 className="text-base font-semibold text-white">{t("camera.title")}</h2>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">{cameraMessage}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-zinc-400">{t("camera.privacy")}</p>
              {cameraStatus === "ready" ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-xl border border-zinc-700 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
                >
                  {t("camera.turnOff")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={cameraStatus === "requesting"}
                  className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-zinc-950 shadow-xs hover:bg-zinc-100 disabled:opacity-50"
                >
                  {cameraStatus === "requesting" ? t("camera.requesting") : t("camera.turnOn")}
                </button>
              )}
            </div>
          </section>

          <aside className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t("options.title")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {t("options.description")}
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="region"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t("options.region")}
                </label>
                <select
                  id="region"
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
                >
                  <option value="">{t("options.selectRegion")}</option>
                  <option value="id-west">{t("options.regions.indonesiaWest")}</option>
                  <option value="id-central">{t("options.regions.indonesiaCentral")}</option>
                  <option value="id-east">{t("options.regions.indonesiaEast")}</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="display-name"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t("options.displayName")}
                </label>
                <input
                  id="display-name"
                  type="text"
                  maxLength={40}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder={t("options.displayNamePlaceholder")}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
