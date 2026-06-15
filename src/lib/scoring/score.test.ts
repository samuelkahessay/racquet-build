import { describe, it, expect } from "vitest";
import { score, scoreRaw } from "./score";
import { DEFAULT_CONFIG, type RacquetConfig } from "@/lib/domain/config";
import { SCORE_AXES } from "@/lib/domain/score";

describe("scoring/score", () => {
  it("neutral default scores 50 on every axis", () => {
    const s = score(DEFAULT_CONFIG);
    for (const axis of SCORE_AXES) expect(s[axis]).toBe(50);
  });

  it("clamps to [0,100]", () => {
    const extreme: RacquetConfig = {
      shape: "teardrop",
      weightClass: "light",
      balance: "headLight",
      stringTensionLb: 18,
      grip: "thickOver",
    };
    const s = scoreRaw(extreme);
    for (const axis of SCORE_AXES) {
      expect(s[axis]).toBeGreaterThanOrEqual(0);
      expect(s[axis]).toBeLessThanOrEqual(100);
    }
  });

  it("higher tension never increases power; lower never increases control", () => {
    const base = { ...DEFAULT_CONFIG, stringTensionLb: 26 };
    const tighter = { ...base, stringTensionLb: 30 };
    const looser = { ...base, stringTensionLb: 22 };
    expect(scoreRaw(tighter).power).toBeLessThan(scoreRaw(base).power);
    expect(scoreRaw(looser).control).toBeLessThan(scoreRaw(base).control);
  });

  it("heavier reduces maneuverability; head-heavy reduces maneuverability", () => {
    expect(scoreRaw({ ...DEFAULT_CONFIG, weightClass: "heavy" }).maneuverability).toBeLessThan(
      scoreRaw(DEFAULT_CONFIG).maneuverability,
    );
    expect(scoreRaw({ ...DEFAULT_CONFIG, balance: "headHeavy" }).maneuverability).toBeLessThan(
      scoreRaw(DEFAULT_CONFIG).maneuverability,
    );
  });

  it("display scores are integers", () => {
    const s = score({ ...DEFAULT_CONFIG, stringTensionLb: 23 });
    for (const axis of SCORE_AXES) expect(Number.isInteger(s[axis])).toBe(true);
  });
});
