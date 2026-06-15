import { describe, it, expect } from "vitest";
import { recommend, type EmphasisVector } from "./recommend";

const emphasis = (partial: Partial<EmphasisVector>): EmphasisVector => {
  const base: EmphasisVector = {
    power: 0,
    control: 0,
    maneuverability: 0,
    forgiveness: 0,
    comfort: 0,
  };
  const merged = { ...base, ...partial };
  const sum = Object.values(merged).reduce((a, b) => a + b, 0) || 1;
  for (const k of Object.keys(merged) as (keyof EmphasisVector)[]) merged[k] /= sum;
  return merged;
};

describe("scoring/recommend", () => {
  it("is deterministic", () => {
    const t = emphasis({ power: 1 });
    expect(recommend(t).config).toEqual(recommend(t).config);
  });
  it("power-seekers get a high-power build", () => {
    const r = recommend(emphasis({ power: 1 }));
    expect(r.scores.power).toBeGreaterThanOrEqual(70);
  });
  it("maneuverability-seekers get a nimble build", () => {
    const r = recommend(emphasis({ maneuverability: 1 }));
    expect(r.config.weightClass).toBe("light");
    expect(r.scores.maneuverability).toBeGreaterThanOrEqual(70);
  });
  it("beginner bias favors forgiveness+comfort on ties", () => {
    const t = emphasis({ control: 1 });
    const plain = recommend(t);
    const beginner = recommend(t, { beginnerBias: true });
    const f = (x: typeof plain) => x.scores.forgiveness + x.scores.comfort;
    expect(f(beginner)).toBeGreaterThanOrEqual(f(plain));
  });
  it("returned distance is a non-negative weighted error, even with beginner bias", () => {
    const t = emphasis({ control: 1 });
    expect(recommend(t).distance).toBeGreaterThanOrEqual(0);
    expect(recommend(t, { beginnerBias: true }).distance).toBeGreaterThanOrEqual(0);
  });
  it("beginner bias does not override a clear power objective", () => {
    const r = recommend(emphasis({ power: 1 }), { beginnerBias: true });
    expect(r.scores.power).toBeGreaterThanOrEqual(70);
  });
  it("degenerate emphasis (all zero) returns a deterministic, finite result", () => {
    const zero: EmphasisVector = {
      power: 0,
      control: 0,
      maneuverability: 0,
      forgiveness: 0,
      comfort: 0,
    };
    const a = recommend(zero);
    const b = recommend(zero);
    expect(Number.isFinite(a.distance)).toBe(true);
    expect(a.config).toEqual(b.config);
  });
  it("sanitizes NaN / negative emphasis instead of producing NaN", () => {
    const bad = {
      power: NaN,
      control: -5,
      maneuverability: 1,
      forgiveness: 0,
      comfort: 0,
    } as EmphasisVector;
    const r = recommend(bad);
    expect(Number.isFinite(r.distance)).toBe(true);
  });
});
