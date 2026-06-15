import { SCORE_AXES, type ScoreVector } from "@/lib/domain/score";
import { TENSION_PIVOT, clampTension, type RacquetConfig } from "@/lib/domain/config";
import {
  SHAPE_DELTA,
  WEIGHT_DELTA,
  BALANCE_DELTA,
  GRIP_DELTA,
  TENSION_COEFF,
  BASELINE,
} from "./model";

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** Pure, deterministic: config -> raw (unrounded, clamped) score vector. */
export function scoreRaw(c: RacquetConfig): ScoreVector {
  // Sanitize tension at the boundary so out-of-range / non-finite input can never
  // leak NaN into the score vector, independent of the caller.
  const tension = clampTension(c.stringTensionLb);
  const out = {} as ScoreVector;
  for (const axis of SCORE_AXES) {
    out[axis] = clamp(
      BASELINE +
        SHAPE_DELTA[c.shape][axis] +
        WEIGHT_DELTA[c.weightClass][axis] +
        BALANCE_DELTA[c.balance][axis] +
        GRIP_DELTA[c.grip][axis] +
        TENSION_COEFF[axis] * (tension - TENSION_PIVOT),
    );
  }
  return out;
}

/** Display-ready: integer scores. */
export function score(c: RacquetConfig): ScoreVector {
  const raw = scoreRaw(c);
  const out = {} as ScoreVector;
  for (const axis of SCORE_AXES) out[axis] = Math.round(raw[axis]);
  return out;
}
