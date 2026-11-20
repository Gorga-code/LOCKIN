/* global importScripts */
// Classic worker: the MediaPipe WASM loader needs importScripts. The CJS build
// writes its public API into `exports`; this tiny shim avoids CDN imports/eval.
self.exports = {};
let detector = null;
let phoneDetector = null;
let phone = { status: "loading", box: null };
let lastPhoneSample = -Infinity;
let lastPhoneHit = -Infinity;
let lastPhoneBox = null;
// Keep the last detection briefly so one missed frame does not make the status flicker.
const phoneHoldMs = 2000;
const phoneIntervalMs = 400;

async function loadPhoneDetector(files) {
  try {
    phoneDetector = await self.exports.ObjectDetector.createFromOptions(files, {
      baseOptions: {
        modelAssetPath: "/models/efficientdet_lite2.tflite",
        delegate: "CPU",
      },
      runningMode: "VIDEO",
      categoryAllowlist: ["cell phone"],
      scoreThreshold: 0.3,
      maxResults: 1,
    });
  } catch {
    phone = { status: "error", box: null };
  }
}

function samplePhone(bitmap, timestamp) {
  if (!phoneDetector || timestamp - lastPhoneSample < phoneIntervalMs) return;
  lastPhoneSample = timestamp;

  try {
    const sample = phoneDetector.detectForVideo(bitmap, timestamp).detections[0]?.boundingBox;
    if (!sample) {
      if (timestamp - lastPhoneHit > phoneHoldMs) {
        phone = { status: "clear", box: null };
      }
      return;
    }

    const clamp = (value) => Math.min(1, Math.max(0, value));
    const x = clamp(sample.originX / bitmap.width);
    const y = clamp(sample.originY / bitmap.height);
    const right = clamp((sample.originX + sample.width) / bitmap.width);
    const bottom = clamp((sample.originY + sample.height) / bitmap.height);
    lastPhoneHit = timestamp;
    lastPhoneBox = { x, y, width: right - x, height: bottom - y };
    phone = { status: "detected", box: lastPhoneBox };
  } catch {
    phone = { status: "error", box: null };
  }
}

self.onmessage = async ({ data }) => {
  if (data.type === "init") {
    try {
      importScripts("/mediapipe/vision_bundle.js");
      const { FaceLandmarker, FilesetResolver } = self.exports;
      const files = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      detector = await FaceLandmarker.createFromOptions(files, {
        baseOptions: {
          modelAssetPath: "/models/face_landmarker.task",
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.6,
        minFacePresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
      });
      self.postMessage({ type: "ready" });
      void loadPhoneDetector(files);
    } catch {
      self.postMessage({ type: "error" });
    }
    return;
  }
  if (data.type !== "frame") return;
  const { bitmap, timestamp } = data;
  try {
    if (!detector) throw new Error("Detector is not ready");
    const result = detector.detectForVideo(bitmap, timestamp);
    const boxes = result.faceLandmarks.map((points) => {
      const x = Math.max(0, Math.min(1, ...points.map((p) => p.x)));
      const y = Math.max(0, Math.min(1, ...points.map((p) => p.y)));
      const right = Math.max(x, Math.min(1, Math.max(...points.map((p) => p.x))));
      const bottom = Math.max(y, Math.min(1, Math.max(...points.map((p) => p.y))));
      return { x, y, width: right - x, height: bottom - y };
    });
    const categories = result.faceBlendshapes[0]?.categories ?? [];
    const left = categories.find((c) => c.categoryName === "eyeBlinkLeft")?.score;
    const right = categories.find((c) => c.categoryName === "eyeBlinkRight")?.score;
    const eyes =
      boxes.length === 1 && left !== undefined && right !== undefined ? { left, right } : null;
    samplePhone(bitmap, timestamp);
    // Only normalized boxes and eyelid scores leave the worker.
    self.postMessage({ type: "result", boxes, eyes, phone });
  } catch {
    self.postMessage({ type: "error" });
  } finally {
    bitmap.close();
  }
};
