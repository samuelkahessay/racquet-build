import { describe, it, expect } from "vitest";
import { buildRacquetGeometry } from "./racquetGeometry";
import { DEFAULT_CONFIG, SHAPES, TENSION_MIN, TENSION_MAX } from "@/lib/domain/config";

const allFinite = (pts: [number, number][]) =>
  pts.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

describe("preview3d/racquetGeometry", () => {
  it("produces a finite, closed head outline for every shape", () => {
    for (const shape of SHAPES) {
      const g = buildRacquetGeometry({ ...DEFAULT_CONFIG, shape });
      expect(g.headOutline.length).toBeGreaterThan(10);
      expect(allFinite(g.headOutline)).toBe(true);
      expect(g.headOutline[0]).toEqual(g.headOutline[g.headOutline.length - 1]);
    }
  });

  it("denser, brighter string bed at higher tension", () => {
    const low = buildRacquetGeometry({ ...DEFAULT_CONFIG, stringTensionLb: TENSION_MIN });
    const high = buildRacquetGeometry({ ...DEFAULT_CONFIG, stringTensionLb: TENSION_MAX });
    expect(high.mains.length).toBeGreaterThanOrEqual(low.mains.length);
    expect(high.stringBrightness).toBeGreaterThan(low.stringBrightness);
  });

  it("moves the balance marker toward the head for head-heavy builds", () => {
    const light = buildRacquetGeometry({ ...DEFAULT_CONFIG, balance: "headLight" });
    const heavy = buildRacquetGeometry({ ...DEFAULT_CONFIG, balance: "headHeavy" });
    expect(heavy.balanceY).toBeGreaterThan(light.balanceY);
  });
});
