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
});
