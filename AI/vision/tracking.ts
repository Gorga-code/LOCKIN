import type { EyeScores } from "./types";

// Both eyes must appear closed for 10 seconds.
export const EYES_CLOSED_MS = 10_000;

// Thresholds for starting and ending an eye closure.
export const EYE_CLOSED_THRESHOLD = 0.6;
export const EYE_REOPEN_THRESHOLD = 0.4;

// Longer processing gaps count as unmonitored time.
export const MAX_SAMPLE_GAP_MS = 2_000;

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

// Start a new session with empty counters.
export function createTrackingState(): TrackingState {
  return {
    lastSample: null,
    absentSince: null,
    closedSince: null,

    totalAwayMs: 0,
    eyeClosureAlerts: 0,
    closureAlerted: false,

    eyes: "unknown",
    awayMs: 0,
    closedMs: 0,
  };
}

// Reset continuous timers while keeping session totals.
// Used when paused, camera is off, or the tab is hidden.
export function suspendTracking(
  state: TrackingState,
): TrackingState {
  return {
    ...createTrackingState(),
    totalAwayMs: state.totalAwayMs,
    eyeClosureAlerts: state.eyeClosureAlerts,
  };
}

// Update tracking whenever the AI returns a result.
// "now" must be a monotonic timestamp in milliseconds.
export function advanceTracking(
  previous: TrackingState,
  now: number,
  faceCount: number,
  scores: EyeScores | null,
): TrackingState {
  const gap =
    previous.lastSample === null
      ? 0
      : now - previous.lastSample;

  // Do not connect observations across monitoring gaps.
  const state =
    previous.lastSample === null ||
    gap < 0 ||
    gap > MAX_SAMPLE_GAP_MS
      ? suspendTracking(previous)
      : previous;

  const delta =
    state.lastSample === null
      ? 0
      : now - state.lastSample;

  // Accumulate time from an absent sample until the
  // next sample, including the sample where a face returns.
  const totalAwayMs =
    state.totalAwayMs +
    (state.absentSince !== null ? delta : 0);

  const absentSince =
    faceCount === 0
      ? (state.absentSince ?? now)
      : null;

  // Missing or invalid eyelid signals mean "unknown".
  const usableEyes =
    faceCount === 1 &&
    scores !== null &&
    Number.isFinite(scores.left) &&
    Number.isFinite(scores.right) &&
    scores.left >= 0 &&
    scores.left <= 1 &&
    scores.right >= 0 &&
    scores.right <= 1;

  // Different thresholds reduce flickering near the boundary.
  const threshold =
    state.closedSince === null
      ? EYE_CLOSED_THRESHOLD
      : EYE_REOPEN_THRESHOLD;

  const closed =
    usableEyes &&
    scores !== null &&
    scores.left >= threshold &&
    scores.right >= threshold;

  const closedSince =
    closed ? (state.closedSince ?? now) : null;

  const closedMs =
    closedSince === null ? 0 : now - closedSince;

  // Count one reminder per continuous eye closure.
  const newAlert =
    closedMs >= EYES_CLOSED_MS &&
    !state.closureAlerted;

  return {
    lastSample: now,
    absentSince,
    closedSince,

    totalAwayMs,
    eyeClosureAlerts:
      state.eyeClosureAlerts + (newAlert ? 1 : 0),
    closureAlerted:
      closed && (state.closureAlerted || newAlert),

    eyes:
      !usableEyes
        ? "unknown"
        : closed
          ? "closed"
          : "open",

    awayMs:
      absentSince === null ? 0 : now - absentSince,

    closedMs,
  };
}