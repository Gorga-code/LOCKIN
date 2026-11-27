import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const ui = fileURLToPath(new URL("../ui/", import.meta.url));
const requireFromRepo = createRequire(path.join(repo, "package.json"));

// These are the two model versions used by LOCKIN's phone-enabled worker.
const models = [
  {
    name: "face_landmarker.task",
    url: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    sha256: "64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff",
  },
  {
    name: "efficientdet_lite2.tflite",
    url: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float32/1/efficientdet_lite2.tflite",
    sha256: "ad2abbf2b4e10585e15176fd7b5ef03c28dda959ae26fc142549fdd1814db91d",
  },
];

const wasmFiles = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];

async function readIfExists(file) {
  try {
    return await readFile(file);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function matchesModel(bytes, model) {
  return bytes !== null && createHash("sha256").update(bytes).digest("hex") === model.sha256;
}

async function prepareModel(model, modelDirectory) {
  const target = path.join(modelDirectory, model.name);
  if (matchesModel(await readIfExists(target), model)) return;

  let bytes = await readIfExists(path.join(repo, "public", "models", model.name));
  if (!matchesModel(bytes, model)) {
    console.log(`Downloading ${model.name} for LOCKIN Desktop...`);
    const response = await fetch(model.url, { signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`Could not download ${model.name}: HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    if (!matchesModel(bytes, model)) throw new Error(`Checksum verification failed for ${model.name}.`);
  }

  // The build sees the completed, verified file even if a previous run was interrupted.
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, bytes);
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
}

let ts;
let bundlePath;
try {
  ts = requireFromRepo("typescript");
  if (typeof ts.transpileModule !== "function") throw new Error("TypeScript 5 is required.");
  bundlePath = requireFromRepo.resolve("@mediapipe/tasks-vision");
} catch {
  throw new Error("Run npm.cmd install from the LOCKIN repo root to install the vision dependencies.");
}

const mediaPipe = path.join(ui, "mediapipe");
const modelDirectory = path.join(ui, "models");
const trackingDirectory = path.join(ui, "vision");
await mkdir(path.join(mediaPipe, "wasm"), { recursive: true });
await mkdir(modelDirectory, { recursive: true });
await mkdir(trackingDirectory, { recursive: true });

await copyFile(bundlePath, path.join(mediaPipe, "vision_bundle.js"));
for (const name of wasmFiles) {
  await copyFile(path.join(path.dirname(bundlePath), "wasm", name), path.join(mediaPipe, "wasm", name));
}
for (const model of models) {
  await prepareModel(model, modelDirectory);
}

const localWorker = (await readIfExists(path.join(repo, "AI", "vision", "face-presence.worker.js")))?.toString("utf8");
let workerSource = localWorker;
if (!workerSource?.includes("efficientdet_lite2.tflite")) {
  console.log("Using the phone-enabled LOCKIN worker bundled with the desktop setup.");
  workerSource = phoneEnabledWorker();
}
await writeFile(path.join(ui, "face-presence.worker.js"), workerSource, "utf8");

for (const name of ["tracking", "types"]) {
  const fileName = name + ".ts";
  const source = await readFile(path.join(repo, "AI", "vision", fileName), "utf8");
  const { outputText, diagnostics = [] } = ts.transpileModule(source, {
    fileName,
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2020 },
    reportDiagnostics: true,
  });
  const errors = diagnostics.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  if (errors.length) {
    throw new Error(errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")).join("\n"));
  }
  await writeFile(path.join(trackingDirectory, name + ".js"), outputText, "utf8");
}

console.log("Desktop camera worker, models, and tracking are ready.");

// Fallback from LOCKIN commit d0c74c3 for checkouts with the face-only worker.
function phoneEnabledWorker() {
  return `/* global importScripts */
// Classic worker: the MediaPipe WASM loader needs importScripts. The CJS build
// writes its public API into \`exports\`; this tiny shim avoids CDN imports/eval.
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
`;
}
