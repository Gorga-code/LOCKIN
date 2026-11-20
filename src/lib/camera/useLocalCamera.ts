"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "ready" | "denied" | "unavailable";

/**
 * Local-only camera stream. The stream is attached to a <video> element and never
 * recorded, uploaded, or persisted. All tracks are stopped on `stop()` and on unmount.
 */
export function useLocalCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef(0);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<CameraStatus>("idle");

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const stop = useCallback(() => {
    requestRef.current++;
    releaseStream();
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      return;
    }

    const request = ++requestRef.current;
    releaseStream();
    setStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (!mountedRef.current || request !== requestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      for (const track of stream.getVideoTracks()) {
        track.addEventListener("ended", () => {
          if (mountedRef.current && streamRef.current === stream) {
            releaseStream();
            setStatus("unavailable");
          }
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (mountedRef.current && request === requestRef.current && streamRef.current === stream)
        setStatus("ready");
    } catch (error) {
      if (!mountedRef.current || request !== requestRef.current) return;
      releaseStream();
      setStatus(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "denied"
          : "unavailable",
      );
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const requests = requestRef;
    return () => {
      mountedRef.current = false;
      requests.current++;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return { videoRef, status, start, stop };
}
