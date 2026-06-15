import type { Shape, WeightClass, Balance, GripSetup } from "@/lib/domain/config";
import type { ScoreVector } from "@/lib/domain/score";

export const BASELINE = 50;

// Each row: additive deltas applied to the 50 baseline. Tune the model here only
// (see docs/spec.md §6.2). Values are intentionally legible, not statistically fitted.

export const SHAPE_DELTA: Record<Shape, ScoreVector> = {
  teardrop: { power: 18, control: -12, maneuverability: 4, forgiveness: 14, comfort: 2 },
  traditional: { power: -10, control: 18, maneuverability: 6, forgiveness: -12, comfort: -2 },
  // hybrid is the neutral reference shape: the 50-baseline origin of the model.
  hybrid: { power: 0, control: 0, maneuverability: 0, forgiveness: 0, comfort: 0 },
};

export const WEIGHT_DELTA: Record<WeightClass, ScoreVector> = {
  light: { power: -8, control: -4, maneuverability: 20, forgiveness: -6, comfort: 4 },
  medium: { power: 0, control: 0, maneuverability: 0, forgiveness: 0, comfort: 0 },
  heavy: { power: 16, control: 8, maneuverability: -20, forgiveness: 8, comfort: -6 },
};

export const BALANCE_DELTA: Record<Balance, ScoreVector> = {
  headLight: { power: -8, control: 4, maneuverability: 16, forgiveness: -2, comfort: 4 },
  even: { power: 0, control: 0, maneuverability: 0, forgiveness: 0, comfort: 0 },
  headHeavy: { power: 14, control: -2, maneuverability: -16, forgiveness: 6, comfort: -4 },
};

export const GRIP_DELTA: Record<GripSetup, ScoreVector> = {
  stock: { power: 0, control: 0, maneuverability: 0, forgiveness: 0, comfort: 0 },
  thinOver: { power: 0, control: 4, maneuverability: 1, forgiveness: 0, comfort: 2 },
  thickOver: { power: 2, control: -4, maneuverability: -1, forgiveness: 3, comfort: 6 },
  tacky: { power: 0, control: 5, maneuverability: 0, forgiveness: 0, comfort: 3 },
};

// Per-lb effect relative to TENSION_PIVOT (26). Lower tension trades control for power/comfort.
export const TENSION_COEFF: ScoreVector = {
  power: -2.2,
  control: 2.0,
  maneuverability: 0,
  forgiveness: -1.0,
  comfort: -1.6,
};
