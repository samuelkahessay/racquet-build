import {
  SHAPES,
  WEIGHT_CLASSES,
  BALANCES,
  GRIPS,
  TENSION_MIN,
  TENSION_MAX,
  type RacquetConfig,
} from "@/lib/domain/config";
import { SCORE_AXES, type ScoreAxis, type ScoreVector } from "@/lib/domain/score";
import { scoreRaw } from "./score";

/** Per-axis desire weights in [0,1]; callers normalize to sum 1. */
export type EmphasisVector = Record<ScoreAxis, number>;

export interface Recommendation {
  config: RacquetConfig;
  scores: ScoreVector;
  distance: number;
}

const TENSION_STEP = 2;
const EPS = 1e-9;

function* candidates(): Generator<RacquetConfig> {
  for (const shape of SHAPES)
    for (const weightClass of WEIGHT_CLASSES)
      for (const balance of BALANCES)
        for (const grip of GRIPS)
          for (let t = TENSION_MIN; t <= TENSION_MAX; t += TENSION_STEP)
            yield { shape, weightClass, balance, grip, stringTensionLb: t };
}

/** Drop non-finite/negative weights and re-normalize; an empty target -> uniform weights. */
function sanitizeEmphasis(target: EmphasisVector): EmphasisVector {
  const out = {} as EmphasisVector;
  let sum = 0;
  for (const axis of SCORE_AXES) {
    const v = Number.isFinite(target[axis]) && target[axis] > 0 ? target[axis] : 0;
    out[axis] = v;
    sum += v;
  }
  if (sum === 0) {
    const uniform = 1 / SCORE_AXES.length;
    for (const axis of SCORE_AXES) out[axis] = uniform;
  } else {
    for (const axis of SCORE_AXES) out[axis] /= sum;
  }
  return out;
}

const beginnerScore = (s: ScoreVector) => s.forgiveness + s.comfort;

/**
 * Inverse model: pick the build whose normalized scores best satisfy the emphasis
 * target (treated as "maximize these axes"). Brute force over the 864-candidate grid —
 * deterministic and sub-millisecond. Lower distance is better; `distance` is the true
 * weighted squared error. `beginnerBias` is a pure tie-breaker (does not perturb the
 * primary objective): among builds within EPS of the best, prefer higher forgiveness +
 * comfort.
 */
export function recommend(
  target: EmphasisVector,
  opts: { beginnerBias?: boolean } = {},
): Recommendation {
  const weights = sanitizeEmphasis(target);
  let best: Recommendation | null = null;
  for (const config of candidates()) {
    const scores = scoreRaw(config);
    let distance = 0;
    for (const axis of SCORE_AXES) {
      const have = scores[axis] / 100;
      distance += weights[axis] * (1 - have) * (1 - have);
    }
    if (best === null || distance < best.distance - EPS) {
      best = { config, scores, distance };
    } else if (
      opts.beginnerBias &&
      Math.abs(distance - best.distance) <= EPS &&
      beginnerScore(scores) > beginnerScore(best.scores)
    ) {
      best = { config, scores, distance };
    }
  }
  return best!;
}
