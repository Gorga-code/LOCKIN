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

const modelPath = path.join(
  publicFolder,
  "models/face_landmarker.task",
);

const modelUrl =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// Verify that the downloaded model is the expected file.
const expectedHash =
  "64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

// Create browser-accessible asset folders.
await mkdir(path.join(outputFolder, "wasm"), {
  recursive: true,
});

await mkdir(path.dirname(modelPath), {
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

// Reuse the model if it is already downloaded and valid.
let modelBytes;

try {
  modelBytes = await readFile(modelPath);
} catch {
  // The first setup will download it below.
}

if (!modelBytes || sha256(modelBytes) !== expectedHash) {
  console.log("Downloading the face/eye model (about 3.8 MB)...");

  const response = await fetch(modelUrl, {
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(`Model download failed: HTTP ${response.status}`);
  }

  modelBytes = Buffer.from(await response.arrayBuffer());

  if (sha256(modelBytes) !== expectedHash) {
    throw new Error("Model verification failed. Please run setup again.");
  }

  await writeFile(modelPath, modelBytes);
}

console.log("AI model, worker, and runtime are ready.");