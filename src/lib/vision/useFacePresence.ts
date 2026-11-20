"use client";

import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import {
  FACE_GRACE_MS,
  FRAME_INTERVAL_MS,
  type FaceBox,
  type VisionCommand,
  type VisionMessage,
} from "@ai/types";

import {
  advanceTracking,
  createTrackingState,
  EYES_CLOSED_MS,
  MAX_SAMPLE_GAP_MS,
  suspendTracking,
  type TrackingState,
} from "@ai/tracking";

type DetectionState = {
  status:
    | "loading"
    | "checking"
    | "present"
    | "waiting"
    | "absent"
    | "error";

  boxes: FaceBox[];
  tracking: TrackingState;
};

export function useFacePresence(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
) {
  const [state, setState] = useState<DetectionState>({
    status: "loading",
    boxes: [],
    tracking: createTrackingState(),
  });

  const [visible, setVisible] = useState(true);
  const [attempt, setAttempt] = useState(0);

  // Session totals survive pauses and camera interruptions.
  const trackingRef = useRef(createTrackingState());

  // Monitor whether the current tab is visible.
  useEffect(() => {
    const updateVisibility = () => {
      setVisible(document.visibilityState === "visible");
    };

    updateVisibility();

    document.addEventListener(
      "visibilitychange",
      updateVisibility,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        updateVisibility,
      );
    };
  }, []);

  useEffect(() => {
    if (!enabled || !visible) return;

    let disposed = false;
    let worker: Worker | undefined;

    let frameTimer:
      | ReturnType<typeof setTimeout>
      | undefined;

    let watchdog:
      | ReturnType<typeof setTimeout>
      | undefined;

    let lastVideoTime = -1;

    setState({
      status: "loading",
      boxes: [],
      tracking: trackingRef.current,
    });

    // Stop processing if loading or inference fails.
    const fail = () => {
      if (disposed) return;

      clearTimeout(frameTimer);
      clearTimeout(watchdog);

      worker?.terminate();
      worker = undefined;

      trackingRef.current = suspendTracking(
        trackingRef.current,
      );

      setState({
        status: "error",
        boxes: [],
        tracking: trackingRef.current,
      });

      disposed = true;
    };

    // Capture and send one frame to the AI worker.
    const sendFrame = async () => {
      if (disposed || !worker) return;

      const video = videoRef.current;

      const frameUnavailable =
        !video ||
        video.readyState < 2 ||
        !video.videoWidth ||
        video.currentTime === lastVideoTime;

      if (frameUnavailable) {
        const lastSample = trackingRef.current.lastSample;

        // A stalled video must not count as continued
        // eye closure or continued absence.
        if (
          lastSample !== null &&
          performance.now() - lastSample >
            MAX_SAMPLE_GAP_MS
        ) {
          trackingRef.current = suspendTracking(
            trackingRef.current,
          );

          setState({
            status: "checking",
            boxes: [],
            tracking: trackingRef.current,
          });
        }

        frameTimer = setTimeout(
          () => void sendFrame(),
          FRAME_INTERVAL_MS,
        );

        return;
      }

      // Explicit check also narrows the TypeScript type.
      if (!video) return;

      lastVideoTime = video.currentTime;

      try {
        const width = Math.min(640, video.videoWidth);

        const height = Math.max(
          1,
          Math.round(
            (width * video.videoHeight) /
              video.videoWidth,
          ),
        );

        const bitmap = await createImageBitmap(video, {
          resizeWidth: width,
          resizeHeight: height,
        });

        // The user may have stopped the camera while
        // this frame was being prepared.
        if (disposed || !worker) {
          bitmap.close();
          return;
        }

        const message: VisionCommand = {
          type: "frame",
          bitmap,
          timestamp: performance.now(),
        };

        try {
          worker.postMessage(message, [bitmap]);
        } catch (error) {
          bitmap.close();
          throw error;
        }

        // Avoid waiting forever for a stalled worker.
        watchdog = setTimeout(fail, 10_000);
      } catch {
        fail();
      }
    };

    try {
      worker = new Worker("/face-presence.worker.js");

      worker.onerror = fail;
      worker.onmessageerror = fail;

      worker.onmessage = (
        event: MessageEvent<VisionMessage>,
      ) => {
        if (disposed) return;

        clearTimeout(watchdog);

        const data = event.data;

        if (data.type === "error") {
          fail();
          return;
        }

        if (data.type === "ready") {
          setState({
            status: "checking",
            boxes: [],
            tracking: trackingRef.current,
          });

          void sendFrame();
          return;
        }

        // Update eye-closure and absence counters.
        trackingRef.current = advanceTracking(
          trackingRef.current,
          performance.now(),
          data.boxes.length,
          data.eyes,
        );

        const tracking = trackingRef.current;

        setState({
          status:
            data.boxes.length > 0
              ? "present"
              : tracking.awayMs >= FACE_GRACE_MS
                ? "absent"
                : "waiting",

          boxes: data.boxes,
          tracking,
        });

        // Schedule only after the previous result.
        // This prevents frames piling up.
        frameTimer = setTimeout(
          () => void sendFrame(),
          FRAME_INTERVAL_MS,
        );
      };

      const message: VisionCommand = {
        type: "init",
      };

      worker.postMessage(message);

      watchdog = setTimeout(fail, 30_000);
    } catch {
      fail();
    }

    // Stop the worker when paused, hidden, disabled,
    // or when the user leaves the page.
    return () => {
      disposed = true;

      clearTimeout(frameTimer);
      clearTimeout(watchdog);

      worker?.terminate();

      trackingRef.current = suspendTracking(
        trackingRef.current,
      );
    };
  }, [enabled, visible, videoRef, attempt]);

  return {
    status: state.status,
    boxes: state.boxes,
    visible,

    absentSeconds: Math.floor(
      state.tracking.awayMs / 1_000,
    ),

    totalAwaySeconds: Math.floor(
      state.tracking.totalAwayMs / 1_000,
    ),

    closedSeconds: Math.floor(
      state.tracking.closedMs / 1_000,
    ),

    eyeState: state.tracking.eyes,

    eyeAlert:
      state.tracking.closedMs >= EYES_CLOSED_MS,

    eyeClosureAlerts:
      state.tracking.eyeClosureAlerts,

    retry: () => {
      setAttempt((value) => value + 1);
    },
  };
}