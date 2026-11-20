"use client";

import { useEffect, type RefObject } from "react";
import { useTranslations } from "next-intl";

import { useFacePresence } from "@/lib/vision/useFacePresence";
import { formatDuration } from "@/lib/sessions/format";

import { EYES_CLOSED_MS } from "@ai/tracking";
import type { VisionSummary } from "@ai/types";

type FacePresenceProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  cameraReady: boolean;
  running: boolean;
  onSummaryChange?: (summary: VisionSummary) => void;
};

export function FacePresence({
  videoRef,
  cameraReady,
  running,
  onSummaryChange,
}: FacePresenceProps) {
  const t = useTranslations("session.solo.detection");

  const {
    status,
    boxes,
    absentSeconds,
    totalAwaySeconds,
    closedSeconds,
    eyeState,
    eyeAlert,
    eyeClosureAlerts,
    visible,
    retry,
  } = useFacePresence(
    videoRef,
    cameraReady && running,
  );

  const mode = !cameraReady
    ? "off"
    : !running
      ? "paused"
      : !visible
        ? "hidden"
        : status;

  const absentAlert = mode === "absent";

  const currentEyeState =
    mode === "present" ? eyeState : "unknown";

  const closedAlert =
    mode === "present" && eyeAlert;

  const currentAwaySeconds =
    mode === "waiting" || mode === "absent"
      ? absentSeconds
      : 0;

  // Share session totals with the existing solo page.
  useEffect(() => {
    onSummaryChange?.({
      awaySeconds: totalAwaySeconds,
      eyeClosureAlerts,
    });
  }, [
    totalAwaySeconds,
    eyeClosureAlerts,
    onSummaryChange,
  ]);

  return (
    <>
      {/* Draw face outlines over the camera video. */}
      {mode === "present" &&
        boxes.map((box, index) => (
          <div
            key={index}
            aria-hidden="true"
            className={`pointer-events-none absolute rounded-lg border-2 ${
              closedAlert
                ? "border-amber-400"
                : "border-emerald-400"
            }`}
            style={{
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.width * 100}%`,
              height: `${box.height * 100}%`,
            }}
          />
        ))}

      {/* Detection information at the bottom of the video. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-black/0 px-4 pb-4 pt-12">
        <div className="flex flex-wrap items-center gap-2">
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${
              absentAlert || closedAlert
                ? "bg-amber-400"
                : mode === "present"
                  ? "bg-emerald-400"
                  : "bg-zinc-400"
            }`}
          />

          <p
            role="status"
            className="text-sm font-semibold text-white"
          >
            {t(mode, {
              count: boxes.length,
              seconds: absentSeconds,
            })}
          </p>

          {mode === "error" && (
            <button
              type="button"
              onClick={retry}
              className="pointer-events-auto rounded-lg bg-white px-3 py-1 text-xs font-semibold text-zinc-950"
            >
              {t("retry")}
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-200">
          {/* Current and accumulated absence time. */}
          <div className="rounded-lg bg-white/10 px-3 py-2">
            <p>{t("awayNow")}</p>

            <p className="mt-1 font-mono text-base font-semibold tabular-nums text-white">
              {formatDuration(currentAwaySeconds)}
            </p>

            <p className="mt-1 text-[10px]">
              {t("awayTotal", {
                duration: formatDuration(totalAwaySeconds),
              })}
            </p>
          </div>

          {/* Eye state and continuous closure time. */}
          <div
            className={`rounded-lg px-3 py-2 ${
              closedAlert
                ? "bg-amber-500/25"
                : "bg-white/10"
            }`}
          >
            <p>{t(`eyes.${currentEyeState}`)}</p>

            <p className="mt-1 font-mono text-base font-semibold tabular-nums text-white">
              {formatDuration(
                currentEyeState === "closed"
                  ? closedSeconds
                  : 0,
              )}
              {" / "}
              {formatDuration(EYES_CLOSED_MS / 1_000)}
            </p>

            <p className="mt-1 text-[10px]">
              {t("eyeAlerts", {
                count: eyeClosureAlerts,
              })}
            </p>
          </div>
        </div>

        {absentAlert && (
          <p
            role="alert"
            className="mt-2 text-sm text-amber-200"
          >
            {t("reminder")}
          </p>
        )}

        {closedAlert && (
          <p
            role="alert"
            className="mt-2 text-sm text-amber-200"
          >
            {t("eyesReminder", {
              seconds: EYES_CLOSED_MS / 1_000,
            })}
          </p>
        )}

        {mode === "error" && (
          <p className="mt-2 text-xs text-zinc-200">
            {t("errorHelp")}
          </p>
        )}

        <p className="mt-2 text-[10px] text-zinc-300">
          {t("disclaimer")}
        </p>
      </div>
    </>
  );
}