import { describe, expect, it } from "vitest";
import {
  advanceTracking,
  createTrackingState,
  EYES_CLOSED_MS,
  suspendTracking,
  type TrackingState,
} from "../src/lib/vision/tracking";

const open = { left: 0.05, right: 0.05 };
const closed = { left: 0.9, right: 0.9 };
function observe(state: TrackingState, from: number, until: number, face = 1, eyes = closed) {
  for (let now = from; now <= until; now += 250)
    state = advanceTracking(state, now, face, face ? eyes : null);
  return state;
}

describe("continuous eye closure", () => {
  it("requires ten seconds and alerts once per uninterrupted closure", () => {
    let state = observe(createTrackingState(), 0, EYES_CLOSED_MS - 250);
    expect(state.eyeClosureAlerts).toBe(0);
    state = advanceTracking(state, EYES_CLOSED_MS, 1, closed);
    expect(state.eyeClosureAlerts).toBe(1);
    expect(state.closedMs).toBe(EYES_CLOSED_MS);
    state = observe(state, 10250, 15000);
    expect(state.eyeClosureAlerts).toBe(1);
  });
  it("does not alert on a short blink and resets on reopening", () => {
    let state = observe(createTrackingState(), 0, 500);
    state = advanceTracking(state, 750, 1, open);
    expect(state.eyes).toBe("open");
    expect(state.closedMs).toBe(0);
    expect(state.eyeClosureAlerts).toBe(0);
  });
  it("requires both eyes to appear closed", () => {
    const state = observe(createTrackingState(), 0, 15000, 1, { left: 0.9, right: 0.1 });
    expect(state.eyeClosureAlerts).toBe(0);
    expect(state.closedMs).toBe(0);
  });
  it("uses hysteresis to tolerate small fluctuations, then resets for an open eye", () => {
    let state = advanceTracking(createTrackingState(), 0, 1, closed);
    state = advanceTracking(state, 250, 1, { left: 0.5, right: 0.5 });
    expect(state.closedMs).toBe(250);
    state = advanceTracking(state, 500, 1, { left: 0.3, right: 0.9 });
    expect(state.closedMs).toBe(0);
    state = advanceTracking(state, 750, 1, { left: 0.5, right: 0.5 });
    expect(state.closedMs).toBe(0);
  });
  it("counts a new reminder only after reopening and another ten-second closure", () => {
    let state = observe(createTrackingState(), 0, 10000);
    state = advanceTracking(state, 10250, 1, open);
    state = observe(state, 10500, 20500);
    expect(state.eyeClosureAlerts).toBe(2);
  });
  it("does not interpret a missing face as closed eyes", () => {
    let state = observe(createTrackingState(), 0, 9000);
    state = advanceTracking(state, 9250, 0, null);
    expect(state.eyes).toBe("unknown");
    expect(state.closedMs).toBe(0);
    state = advanceTracking(state, 9500, 1, closed);
    expect(state.closedMs).toBe(0);
    expect(state.eyeClosureAlerts).toBe(0);
  });
  it("resets closure on missing or invalid eye scores", () => {
    for (const eyes of [null, { left: NaN, right: 0.9 }, { left: 2, right: 0.9 }]) {
      const state = advanceTracking(observe(createTrackingState(), 0, 9000), 9250, 1, eyes);
      expect(state.eyes).toBe("unknown");
      expect(state.closedMs).toBe(0);
    }
  });
});

describe("observed time outside camera view", () => {
  it("shows current absence and retains totals after the face returns", () => {
    let state = observe(createTrackingState(), 0, 6000, 0);
    expect(state.awayMs).toBe(6000);
    state = advanceTracking(state, 6250, 1, open);
    expect(state.awayMs).toBe(0);
    expect(state.totalAwayMs).toBe(6250);
    state = advanceTracking(state, 6500, 0, null);
    state = advanceTracking(state, 6750, 0, null);
    expect(state.totalAwayMs).toBe(6500);
  });
  it("excludes monitoring gaps from totals and restarts continuous timers", () => {
    let state = observe(createTrackingState(), 0, 1000, 0);
    state = advanceTracking(state, 30000, 0, null);
    expect(state.totalAwayMs).toBe(1000);
    expect(state.awayMs).toBe(0);
    const closedState = advanceTracking(observe(createTrackingState(), 0, 9000), 30000, 1, closed);
    expect(closedState.closedMs).toBe(0);
    expect(closedState.eyeClosureAlerts).toBe(0);
  });
  it("preserves totals across pause/camera-off/hidden, but never counts suspended time", () => {
    let state = suspendTracking(observe(createTrackingState(), 0, 3000, 0));
    state = advanceTracking(state, 120000, 0, null);
    expect(state.totalAwayMs).toBe(3000);
    expect(state.awayMs).toBe(0);
    state = advanceTracking(state, 120250, 0, null);
    expect(state.totalAwayMs).toBe(3250);
  });
  it("never creates negative time from an out-of-order sample", () => {
    const state = advanceTracking(observe(createTrackingState(), 0, 1000, 0), 500, 0, null);
    expect(state.totalAwayMs).toBe(1000);
    expect(state.awayMs).toBe(0);
  });
  it("starts a new session with zero counters", () => {
    expect(createTrackingState().totalAwayMs).toBe(0);
    expect(createTrackingState().eyeClosureAlerts).toBe(0);
  });
});
