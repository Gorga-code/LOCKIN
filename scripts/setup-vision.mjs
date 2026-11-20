import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Find the LOCKIN project root.
const root = fileURLToPath(new URL("../", import.meta.url));

const runtimeFolder = path.join(
  root,
  "node_modules/@mediapipe/tasks-vision",
);

const publicFolder = path.join(root, "public");
const outputFolder = path.join(publicFolder, "mediapipe");

const modelFolder = path.join(publicFolder, "models");
const models = [
  {
    name: "face_landmarker.task",
    url: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    hash: "64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff",
  },
  {
    name: "efficientdet_lite2.tflite",
    url: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float32/1/efficientdet_lite2.tflite",
    hash: "ad2abbf2b4e10585e15176fd7b5ef03c28dda959ae26fc142549fdd1814db91d",
  },
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

// Create browser-accessible asset folders.
await mkdir(path.join(outputFolder, "wasm"), {
  recursive: true,
});

await mkdir(modelFolder, {
  recursive: true,
});

// Copy your AI worker into the browser's public folder.
// Keep editing the original file in AI/vision.
await copyFile(
  path.join(root, "AI/vision/face-presence.worker.js"),
  path.join(publicFolder, "face-presence.worker.js"),
);

// Prepare the MediaPipe JavaScript runtime.
await copyFile(
  path.join(runtimeFolder, "vision_bundle.cjs"),
  path.join(outputFolder, "vision_bundle.js"),
);

// Prepare matching WebAssembly files.
const wasmFiles = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];

for (const filename of wasmFiles) {
  await copyFile(
    path.join(runtimeFolder, "wasm", filename),
    path.join(outputFolder, "wasm", filename),
  );
}

// Reuse each model if the existing download matches the expected checksum.
for (const model of models) {
  const modelPath = path.join(modelFolder, model.name);
  const existing = await readFile(modelPath).catch((error) => {
    if (error.code !== "ENOENT") throw error;
    return null;
  });
  if (existing && sha256(existing) === model.hash) continue;

  console.log("Downloading " + model.name + "...");
  const response = await fetch(model.url, {
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(model.name + " download failed: HTTP " + response.status);
  }

  const modelBytes = Buffer.from(await response.arrayBuffer());
  if (sha256(modelBytes) !== model.hash) {
    throw new Error(model.name + " verification failed. Please run setup again.");
  }
  await writeFile(modelPath, modelBytes);
}

console.log("AI models, worker, and runtime are ready.");
