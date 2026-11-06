import type { EyeScores } from "./types";

// Blink blendshape coefficients are not probabilities of sleep.
export const EYES_CLOSED_MS = 10_000;
export const EYE_CLOSED_THRESHOLD = 0.6;
export const EYE_REOPEN_THRESHOLD = 0.4;
export const MAX_SAMPLE_GAP_MS = 2000;

export type TrackingState = {
  lastSample: number | null;
  absentSince: number | null;
  closedSince: number | null;
  totalAwayMs: number;
  eyeClosureAlerts: number;
  closureAlerted: boolean;
  eyes: "open" | "closed" | "unknown";
  awayMs: number;
  closedMs: number;
};

export const createTrackingState = (): TrackingState => ({
  lastSample: null,
  absentSince: null,
  closedSince: null,
  totalAwayMs: 0,
  eyeClosureAlerts: 0,
  closureAlerted: false,
  eyes: "unknown",
  awayMs: 0,
  closedMs: 0,
});

/** Keep session totals, but never bridge a pause, hidden tab, or camera-off gap. */
export function suspendTracking(state: TrackingState): TrackingState {
  return {
    ...createTrackingState(),
    totalAwayMs: state.totalAwayMs,
    eyeClosureAlerts: state.eyeClosureAlerts,
  };
}

export function advanceTracking(
  previous: TrackingState,
  now: number,
  faceCount: number,
  scores: EyeScores | null,
): TrackingState {
  const gap = previous.lastSample === null ? 0 : now - previous.lastSample;
  const state =
    previous.lastSample === null || gap < 0 || gap > MAX_SAMPLE_GAP_MS
      ? suspendTracking(previous)
      : previous;
  const delta = state.lastSample === null ? 0 : now - state.lastSample;
  // Count observed absence from the first absent sample up to the returning sample.
  // Intervals exceeding MAX_SAMPLE_GAP_MS are unknown and excluded entirely.
  const totalAwayMs = state.totalAwayMs + (state.absentSince !== null ? delta : 0);
  const absentSince = faceCount === 0 ? (state.absentSince ?? now) : null;
  const usableEyes =
    faceCount === 1 &&
    scores !== null &&
    Number.isFinite(scores.left) &&
    Number.isFinite(scores.right) &&
    scores.left >= 0 &&
    scores.left <= 1 &&
    scores.right >= 0 &&
    scores.right <= 1;
  const threshold = state.closedSince === null ? EYE_CLOSED_THRESHOLD : EYE_REOPEN_THRESHOLD;
  const closed = usableEyes && scores!.left >= threshold && scores!.right >= threshold;
  const closedSince = closed ? (state.closedSince ?? now) : null;
  const closedMs = closedSince === null ? 0 : now - closedSince;
  const newAlert = closedMs >= EYES_CLOSED_MS && !state.closureAlerted;
  return {
    lastSample: now,
    absentSince,
    closedSince,
    totalAwayMs,
    eyeClosureAlerts: state.eyeClosureAlerts + (newAlert ? 1 : 0),
    closureAlerted: closed && (state.closureAlerted || newAlert),
    eyes: !usableEyes ? "unknown" : closed ? "closed" : "open",
    awayMs: absentSince === null ? 0 : now - absentSince,
    closedMs,
  };
}
