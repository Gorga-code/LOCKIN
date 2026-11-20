/* global importScripts */
// Classic worker: the MediaPipe WASM loader needs importScripts. The CJS build
// writes its public API into `exports`; this tiny shim avoids CDN imports/eval.
self.exports = {};
let detector = null;

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
    // Pixels/landmarks stay here. Only normalized boxes and eyelid scores leave.
    self.postMessage({ type: "result", boxes, eyes });
  } catch {
    self.postMessage({ type: "error" });
  } finally {
    bitmap.close();
  }
};
