import { describe, expect, it } from "vitest";
import { FACE_GRACE_MS, nextAbsenceStart } from "../src/lib/vision/types";

describe("continuous face absence", () => {
  it("requires five seconds of observed absence before the reminder", () => {
    const start = nextAbsenceStart(null, null, 1000, 0);
    expect(start).toBe(1000);
    expect(nextAbsenceStart(start, 1000, 1250, 0)).toBe(1000);
    expect(5999 - start!).toBeLessThan(FACE_GRACE_MS);
    expect(6000 - start!).toBe(FACE_GRACE_MS);
  });
  it("clears absence as soon as a face returns", () => {
    expect(nextAbsenceStart(1000, 5000, 5250, 1)).toBeNull();
  });
  it("starts a fresh grace period after a monitoring gap", () => {
    expect(nextAbsenceStart(1000, 2000, 10000, 0)).toBe(10000);
  });
  it("treats multiple visible faces as presence without identifying a user", () => {
    expect(nextAbsenceStart(1000, 2000, 2250, 2)).toBeNull();
  });
});
