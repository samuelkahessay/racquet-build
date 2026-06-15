import { describe, it, expect } from "vitest";
import { DEFAULT_CONFIG, clampTension, TENSION_MIN, TENSION_MAX, SHAPES } from "./config";

describe("domain/config", () => {
  it("default config is the neutral center", () => {
    expect(DEFAULT_CONFIG).toEqual({
      shape: "hybrid",
      weightClass: "medium",
      balance: "even",
      stringTensionLb: 26,
      grip: "stock",
    });
  });
  it("clampTension clamps and rounds", () => {
    expect(clampTension(10)).toBe(TENSION_MIN);
    expect(clampTension(99)).toBe(TENSION_MAX);
    expect(clampTension(25.6)).toBe(26);
  });
  it("clampTension returns a safe default for non-finite input", () => {
    expect(clampTension(NaN)).toBe(26);
    expect(clampTension(Infinity)).toBe(26);
  });
  it("enumerates all shapes", () => {
    expect(SHAPES).toEqual(["teardrop", "traditional", "hybrid"]);
  });
});
