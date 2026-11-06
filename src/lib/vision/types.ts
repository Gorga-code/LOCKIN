export const FACE_GRACE_MS = 5000;
export const FRAME_INTERVAL_MS = 250;

export type EyeScores = { left: number; right: number };
export type VisionSummary = { awaySeconds: number; eyeClosureAlerts: number };

export type FaceBox = { x: number; y: number; width: number; height: number };
export type VisionCommand =
  { type: "init" } | { type: "frame"; bitmap: ImageBitmap; timestamp: number };
export type VisionMessage =
  | { type: "ready" }
  | { type: "result"; boxes: FaceBox[]; eyes: EyeScores | null }
  | { type: "error" };

// A long processing gap starts a new grace period. An unobserved interval must
// never be interpreted as continuous face absence.
export function nextAbsenceStart(
  previous: number | null,
  lastSample: number | null,
  now: number,
  faceCount: number,
) {
  if (faceCount > 0) return null;
  return previous === null || lastSample === null || now - lastSample > 2000 ? now : previous;
}
