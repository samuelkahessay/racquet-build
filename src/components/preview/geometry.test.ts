import { describe, it, expect } from "vitest";
import { buildRacquetGeometry } from "./geometry";
import { DEFAULT_CONFIG, SHAPES, TENSION_MIN, TENSION_MAX } from "@/lib/domain/config";

const allFinite = (pts: [number, number][]) =>
  pts.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

describe("preview/geometry", () => {
  it("produces a finite, closed frame loop for every shape", () => {
    for (const shape of SHAPES) {
      const g = buildRacquetGeometry({ ...DEFAULT_CONFIG, shape });
      expect(g.frame.length).toBeGreaterThan(20);
      expect(allFinite(g.frame)).toBe(true);
      // a closed loop: the path emitter re-joins first<->last, both near the top tip
      expect(g.frame[0][0]).toBeCloseTo(0, 1);
      expect(g.frame[g.frame.length - 1][0]).toBeCloseTo(0, 1);
    }
  });

  it("opens the throat for teardrop/hybrid and bridges it for traditional", () => {
    expect(buildRacquetGeometry({ ...DEFAULT_CONFIG, shape: "teardrop" }).bridge).toBeNull();
    expect(buildRacquetGeometry({ ...DEFAULT_CONFIG, shape: "hybrid" }).bridge).toBeNull();
    expect(buildRacquetGeometry({ ...DEFAULT_CONFIG, shape: "traditional" }).bridge).not.toBeNull();
  });

  it("strings the teardrop deeper than the head (into the throat)", () => {
    const g = buildRacquetGeometry({ ...DEFAULT_CONFIG, shape: "teardrop" });
    // some mains reach below the head centre — i.e. down the throat
    const lowest = Math.min(...g.mains.map((m) => Math.min(m[0][1], m[1][1])));
    expect(lowest).toBeLessThan(300);
  });

  it("denser, brighter string bed at higher tension", () => {
    const low = buildRacquetGeometry({ ...DEFAULT_CONFIG, stringTensionLb: TENSION_MIN });
    const high = buildRacquetGeometry({ ...DEFAULT_CONFIG, stringTensionLb: TENSION_MAX });
    expect(high.mains.length).toBeGreaterThanOrEqual(low.mains.length);
    expect(high.crosses.length).toBeGreaterThanOrEqual(low.crosses.length);
    expect(high.stringBrightness).toBeGreaterThan(low.stringBrightness);
  });

  it("thickens the beam for heavier frames", () => {
    const light = buildRacquetGeometry({ ...DEFAULT_CONFIG, weightClass: "light" });
    const heavy = buildRacquetGeometry({ ...DEFAULT_CONFIG, weightClass: "heavy" });
    expect(heavy.beamWidth).toBeGreaterThan(light.beamWidth);
  });

  it("moves the balance marker toward the head for head-heavy builds", () => {
    const light = buildRacquetGeometry({ ...DEFAULT_CONFIG, balance: "headLight" });
    const heavy = buildRacquetGeometry({ ...DEFAULT_CONFIG, balance: "headHeavy" });
    expect(heavy.balanceY).toBeGreaterThan(light.balanceY);
  });

  it("accents the grip only for a tacky setup", () => {
    expect(buildRacquetGeometry({ ...DEFAULT_CONFIG, grip: "tacky" }).grip.accent).toBe(true);
    expect(buildRacquetGeometry({ ...DEFAULT_CONFIG, grip: "stock" }).grip.accent).toBe(false);
  });
});
