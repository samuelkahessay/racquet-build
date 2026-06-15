import { describe, it, expect } from "vitest";
import { buildRacquetGeometry } from "./geometry";
import { DEFAULT_CONFIG, SHAPES, TENSION_MIN, TENSION_MAX } from "@/lib/domain/config";

const allFinite = (pts: [number, number][]) =>
  pts.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
const extentY = (pts: [number, number][]) => {
  const ys = pts.map(([, y]) => y);
  return { min: Math.min(...ys), max: Math.max(...ys) };
};
const halfWidthAtY = (pts: [number, number][], y: number) => {
  const hits: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    if ((y <= ay && y >= by) || (y >= ay && y <= by)) {
      const dy = by - ay;
      const t = Math.abs(dy) < 0.001 ? 0 : (y - ay) / dy;
      hits.push(ax + (bx - ax) * Math.max(0, Math.min(1, t)));
    }
  }
  return Math.max(...hits.map(Math.abs));
};
const longestMain = (shape: typeof DEFAULT_CONFIG.shape) => {
  const g = buildRacquetGeometry({ ...DEFAULT_CONFIG, shape });
  return Math.max(...g.mains.map((m) => Math.abs(m[0][1] - m[1][1])));
};

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

  it("keeps the racket and mains within World Squash dimensional limits", () => {
    for (const shape of SHAPES) {
      const g = buildRacquetGeometry({ ...DEFAULT_CONFIG, shape });
      const frameY = extentY(g.frame);
      expect(frameY.max - g.grip.buttY).toBeLessThanOrEqual(686);
      for (const main of g.mains) {
        expect(Math.abs(main[0][1] - main[1][1])).toBeLessThanOrEqual(390);
      }
    }
  });

  it("opens the throat for teardrop, yokes hybrid, and bridges traditional", () => {
    expect(buildRacquetGeometry({ ...DEFAULT_CONFIG, shape: "teardrop" }).bridge).toBeNull();
    const hybridBridge = buildRacquetGeometry({ ...DEFAULT_CONFIG, shape: "hybrid" }).bridge;
    const traditionalBridge = buildRacquetGeometry({ ...DEFAULT_CONFIG, shape: "traditional" }).bridge;
    expect(hybridBridge).not.toBeNull();
    expect(traditionalBridge).not.toBeNull();
    expect(hybridBridge?.length).toBeGreaterThan(3);
    expect(traditionalBridge?.length).toBeGreaterThan(3);
    expect(Math.min(...hybridBridge!.map(([, y]) => y))).toBeLessThan(
      Math.max(...hybridBridge!.map(([, y]) => y)),
    );
    expect(Math.min(...traditionalBridge!.map(([, y]) => y))).toBeLessThan(
      Math.max(...traditionalBridge!.map(([, y]) => y)),
    );
  });

  it("strings the teardrop deeper than the head (into the throat)", () => {
    const g = buildRacquetGeometry({ ...DEFAULT_CONFIG, shape: "teardrop" });
    // some mains reach below the head centre — i.e. down the throat
    const lowest = Math.min(...g.mains.map((m) => Math.min(m[0][1], m[1][1])));
    expect(lowest).toBeLessThan(300);
  });

  it("gives teardrops longer mains than hybrid and traditional frames", () => {
    expect(longestMain("teardrop")).toBeGreaterThan(longestMain("hybrid"));
    expect(longestMain("hybrid")).toBeGreaterThan(longestMain("traditional"));
  });

  it("keeps squash heads broad and smoothly tapered instead of pinched", () => {
    const teardrop = buildRacquetGeometry({ ...DEFAULT_CONFIG, shape: "teardrop" });
    const traditional = buildRacquetGeometry({ ...DEFAULT_CONFIG, shape: "traditional" });
    const hybrid = buildRacquetGeometry({ ...DEFAULT_CONFIG, shape: "hybrid" });

    expect(halfWidthAtY(teardrop.frame, 610)).toBeGreaterThan(70);
    expect(halfWidthAtY(teardrop.frame, 500)).toBeGreaterThan(70);
    expect(halfWidthAtY(teardrop.frame, 340)).toBeGreaterThan(45);

    expect(halfWidthAtY(traditional.frame, 610)).toBeGreaterThan(85);
    expect(halfWidthAtY(traditional.frame, 470)).toBeGreaterThan(80);
    expect(halfWidthAtY(traditional.frame, 340)).toBeGreaterThan(40);

    expect(halfWidthAtY(hybrid.frame, 610)).toBeGreaterThan(75);
    expect(halfWidthAtY(hybrid.frame, 500)).toBeGreaterThan(75);
    expect(halfWidthAtY(hybrid.frame, 300)).toBeGreaterThan(35);
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
