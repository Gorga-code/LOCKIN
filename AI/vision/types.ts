// Check up to four camera frames per second.
export const FRAME_INTERVAL_MS = 250;

// Show an absence reminder after five seconds.
export const FACE_GRACE_MS = 5_000;

// Eyelid signals returned by the model.
export type EyeScores = {
  left: number;
  right: number;
};

// Face position, with coordinates normalized between 0 and 1.
export type FaceBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// Camera-monitoring summary for the current session.
export type VisionSummary = {
  awaySeconds: number;
  eyeClosureAlerts: number;
};

// Instructions sent to the AI worker.
export type VisionCommand =
  | { type: "init" }
  | {
      type: "frame";
      bitmap: ImageBitmap;
      timestamp: number;
    };

// Results sent back by the AI worker.
export type VisionMessage =
  | { type: "ready" }
  | {
      type: "result";
      boxes: FaceBox[];
      eyes: EyeScores | null;
    }
  | { type: "error" };