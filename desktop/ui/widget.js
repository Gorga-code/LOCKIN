import {
  advanceTracking,
  createTrackingState,
  EYES_CLOSED_MS,
  MAX_SAMPLE_GAP_MS,
  suspendTracking,
} from "./vision/tracking.js";
import { FACE_GRACE_MS, FRAME_INTERVAL_MS } from "./vision/types.js";

import { connectWidgetShell } from "./widget-shell.js";

const { invoke } = window.__TAURI__.core;
const root = document.documentElement;
const widget = document.getElementById("widget");
const shape = connectWidgetShell(widget, invoke, window.__TAURI__.event.listen);
const camera = document.getElementById("focus-camera");
const startButton = document.getElementById("focus-start");
const stopButton = document.getElementById("focus-stop");
const message = document.getElementById("focus-message");
const clock = document.getElementById("focus-time");
const metrics = document.getElementById("focus-metrics");
const [awayMetric, phoneMetric, eyeMetric] = metrics.children;

const RECORD_KEY = "lockin.desktop.lastFocus.v1";
const DOCK_SIDES = new Set(["left", "right", "top", "bottom"]);
const MODEL_TIMEOUT_MS = 30_000;
const FRAME_TIMEOUT_MS = 12_000;
let watchId = 0;
let session = null;

function watchDock() {
  const id = ++watchId;

  async function refresh() {
    if (id !== watchId) return;
    try {
      const [side, dragging] = await invoke("dock_status");
      if (id !== watchId) return;

      if (DOCK_SIDES.has(side)) {
        if (root.dataset.dock !== side) root.dataset.dock = side;
      } else {
        delete root.dataset.dock;
      }

      shape.updateDock(side, dragging);
      if (dragging) window.setTimeout(refresh, 16);
    } catch (error) {
      shape.cancelDrag();
      console.error("Could not read LOCKIN dock state:", error);
    }
  }

  void refresh();
}

function formatDuration(milliseconds) {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1_000);
  const part = (value) => String(value).padStart(2, "0");
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor(seconds / 60) % 60;
  const time = `${part(minutes)}:${part(seconds % 60)}`;
  return hours ? `${hours}:${time}` : time;
}

function render({ text, active = false, angry = false, summary = null }) {
  widget.dataset.mood = angry ? "angry" : "calm";
  shape.warn(angry ? text : "");
  startButton.hidden = active;
  stopButton.hidden = !active;
  if (message.textContent !== text) message.textContent = text;

  clock.hidden = !summary;
  metrics.hidden = !summary;
  if (summary) {
    clock.textContent = formatDuration(summary.elapsedMs);
    const phoneCount = summary.phoneSampled ? summary.phoneAlerts : "—";
    awayMetric.textContent = `Away ${formatDuration(summary.awayMs)}`;
    phoneMetric.textContent = `Phone ${phoneCount}`;
    eyeMetric.textContent = `Eyes ${summary.eyeAlerts}`;
  }
}

function sessionSummary(run, now = performance.now()) {
  if (run.startedAt === null) return null;
  return {
    elapsedMs: Math.max(0, now - run.startedAt),
    awayMs: run.tracking.totalAwayMs,
    phoneAlerts: run.phoneAlerts,
    phoneSampled: run.phoneSampled,
    eyeAlerts: run.tracking.eyeClosureAlerts,
  };
}

function loadSummary() {
  try {
    const value = JSON.parse(localStorage.getItem(RECORD_KEY));
    const metrics = ["elapsedMs", "awayMs", "phoneAlerts", "eyeAlerts"];
    if (value && metrics.every((key) => Number.isFinite(value[key]) && value[key] >= 0)) {
      return value;
    }
  } catch (error) {
    console.debug("Could not read the last focus recap:", error);
  }
  return null;
}

function stopTracks(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

function endFocus(reason) {
  const run = session;
  if (!run) return;
  session = null;

  window.clearTimeout(run.frameTimer);
  window.clearTimeout(run.watchdog);
  run.worker?.terminate();
  stopTracks(run.stream);
  camera.pause();
  camera.srcObject = null;

  const summary = sessionSummary(run);
  if (summary) {
    try {
      localStorage.setItem(RECORD_KEY, JSON.stringify(summary));
    } catch (error) {
      console.debug("Could not save the focus recap:", error);
    }
  }
  render({ text: reason ?? (summary ? "Session complete" : "Camera off"), summary });
}

function fail(run, text, error) {
  if (session !== run) return;
  if (error) console.error("LOCKIN camera:", error);
  endFocus(text);
}

function setWatchdog(run, delay, text) {
  window.clearTimeout(run.watchdog);
  run.watchdog = window.setTimeout(() => fail(run, text), delay);
}

function scheduleFrame(run, delay = FRAME_INTERVAL_MS) {
  run.frameTimer = window.setTimeout(() => void sendFrame(run), delay);
}

function renderDetection(run) {
  // Show the highest-priority warning. The others stay active in the tracker.
  const warning = run.phoneStatus === "detected"
    ? "Put your phone down."
    : run.tracking.awayMs >= FACE_GRACE_MS
      ? "Come back to the screen."
      : run.tracking.closedMs >= EYES_CLOSED_MS
        ? "Open your eyes."
        : null;

  let text = "Stay focused";
  if (run.phoneStatus === "loading") text = "Loading phone detection…";
  if (run.phoneStatus === "error") text = "Phone detection unavailable";
  render({ text: warning ?? text, active: true, angry: Boolean(warning), summary: sessionSummary(run) });
}

async function sendFrame(run) {
  if (session !== run || !run.worker) return;
  const now = performance.now();
  if (camera.readyState < 2 || !camera.videoWidth || camera.currentTime === run.lastVideoTime) {
    const gap = now - run.lastProgressAt;
    if (gap >= FRAME_TIMEOUT_MS) {
      fail(run, "Camera stopped updating. Try Start.");
      return;
    }
    if (gap >= MAX_SAMPLE_GAP_MS && !run.waitingForFrames) {
      run.waitingForFrames = true;
      run.tracking = suspendTracking(run.tracking);
      run.phoneStatus = "loading";
      render({ text: "Waiting for camera frames…", active: true, summary: sessionSummary(run) });
    }
    scheduleFrame(run);
    return;
  }

  run.lastVideoTime = camera.currentTime;
  run.frameTimestamp = now;
  const width = Math.min(camera.videoWidth, 640);
  const height = Math.max(1, Math.round(width * camera.videoHeight / camera.videoWidth));
  let bitmap;

  setWatchdog(run, FRAME_TIMEOUT_MS, "Camera analysis timed out. Try Start.");
  try {
    bitmap = await createImageBitmap(camera, { resizeWidth: width, resizeHeight: height });
    if (session !== run) {
      bitmap.close();
      return;
    }
    run.worker.postMessage({ type: "frame", bitmap, timestamp: now }, [bitmap]);
  } catch (error) {
    bitmap?.close();
    fail(run, "Could not analyze the camera. Try Start.", error);
  }
}

function receiveVision(run, data) {
  if (session !== run) return;
  window.clearTimeout(run.watchdog);

  if (data.type === "ready") {
    run.lastProgressAt = performance.now();
    render({ text: "Checking the camera…", active: true });
    scheduleFrame(run, 0);
    return;
  }

  if (data.type !== "result") {
    fail(run, "Vision could not load. See setup Step 3.");
    return;
  }

  run.lastProgressAt = performance.now();
  run.waitingForFrames = false;
  run.startedAt ??= run.frameTimestamp;
  run.tracking = advanceTracking(run.tracking, run.frameTimestamp, data.boxes.length, data.eyes);

  const phoneStatus = data.phone?.status ?? "loading";
  if (phoneStatus === "clear" || phoneStatus === "detected") run.phoneSampled = true;
  if (phoneStatus === "detected" && run.phoneStatus !== "detected") run.phoneAlerts += 1;
  run.phoneStatus = phoneStatus;

  renderDetection(run);
  scheduleFrame(run);
}

function cameraError(error) {
  if (error.name === "NotAllowedError") return "Allow camera access, then press Start.";
  if (error.name === "NotFoundError") return "No camera found.";
  if (error.name === "NotReadableError") return "Camera busy. Close other camera apps.";
  return "Could not start the camera. Try Start.";
}

async function startFocus() {
  if (session) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    render({ text: "Camera needs the LOCKIN desktop window." });
    return;
  }

  const run = {
    tracking: createTrackingState(),
    phoneStatus: "loading",
    phoneAlerts: 0,
    phoneSampled: false,
    lastVideoTime: -1,
    lastProgressAt: 0,
    waitingForFrames: false,
    frameTimestamp: 0,
    startedAt: null,
  };
  session = run;
  render({ text: "Opening camera…", active: true });

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
    });
    if (session !== run) {
      stopTracks(stream);
      return;
    }
    run.stream = stream;
    for (const track of stream.getVideoTracks()) {
      track.addEventListener("ended", () => fail(run, "Camera disconnected."), { once: true });
    }

    camera.srcObject = stream;
    setWatchdog(run, FRAME_TIMEOUT_MS, "Video could not start. Try Start.");
    await camera.play();
    if (session !== run) return;

    render({ text: "Loading detection…", active: true });
    const worker = new Worker(new URL("./face-presence.worker.js", import.meta.url));
    run.worker = worker;
    worker.addEventListener("message", (event) => receiveVision(run, event.data));
    worker.addEventListener("error", (event) => fail(run, "Vision could not load. See setup Step 3.", event));
    worker.addEventListener("messageerror", (event) => fail(run, "Camera analysis failed. Try Start.", event));
    setWatchdog(run, MODEL_TIMEOUT_MS, "Vision could not load. See setup Step 3.");
    worker.postMessage({ type: "init" });
  } catch (error) {
    fail(run, cameraError(error), error);
  }
}

document.getElementById("drag-handle").addEventListener("mousedown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  shape.beginDrag();
  invoke("drag_widget").then(watchDock).catch((error) => {
    shape.cancelDrag();
    console.error(error);
  });
});

startButton.addEventListener("click", () => void startFocus());
stopButton.addEventListener("click", () => endFocus());

const closeButton = document.getElementById("close");
closeButton.addEventListener("click", async () => {
  if (closeButton.disabled) return;
  closeButton.disabled = true;
  widget.inert = true;
  endFocus();

  try {
    await invoke("return_to_website");
  } catch (error) {
    console.error("Could not open LOCKIN:", error);
  }

  try {
    await invoke("close_widget");
  } catch (error) {
    console.error("Could not close LOCKIN Desktop:", error);
    widget.inert = false;
    closeButton.disabled = false;
  }
});
window.addEventListener("pagehide", () => endFocus());

const previous = loadSummary();
render({ text: previous ? "Last session" : "Camera off", summary: previous });
watchDock();
