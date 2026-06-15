import { describe, it, expect } from "vitest";
import { explain, describe as describeConfig } from "./explain";
import { DEFAULT_CONFIG } from "@/lib/domain/config";

describe("scoring/explain", () => {
  it("returns no bullets when nothing changes", () => {
    expect(explain(DEFAULT_CONFIG, DEFAULT_CONFIG)).toEqual([]);
  });
  it("leads with the largest score change and notes direction", () => {
    const next = { ...DEFAULT_CONFIG, weightClass: "heavy" as const };
    const bullets = explain(DEFAULT_CONFIG, next);
    expect(bullets.length).toBeGreaterThan(0);
    // largest delta for medium->heavy is maneuverability (-20)
    expect(bullets[0].toLowerCase()).toContain("maneuverability");
    expect(bullets[0].toLowerCase()).toContain("less");
  });
  it("caps the number of bullets", () => {
    const next = {
      shape: "teardrop",
      weightClass: "light",
      balance: "headLight",
      stringTensionLb: 20,
      grip: "thickOver",
    } as const;
    expect(explain(DEFAULT_CONFIG, next).length).toBeLessThanOrEqual(3);
  });
  it("describe returns a non-empty summary for a non-neutral build", () => {
    expect(describeConfig({ ...DEFAULT_CONFIG, shape: "teardrop" }).length).toBeGreaterThan(0);
  });
});
