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

function* candidates(): Generator<RacquetConfig> {
  for (const shape of SHAPES)
    for (const weightClass of WEIGHT_CLASSES)
      for (const balance of BALANCES)
        for (const grip of GRIPS)
          for (let t = TENSION_MIN; t <= TENSION_MAX; t += TENSION_STEP)
            yield { shape, weightClass, balance, grip, stringTensionLb: t };
}

/**
 * Inverse model: pick the build whose normalized scores best satisfy the emphasis
 * target (treated as "maximize these axes"). Brute force over the 864-candidate grid —
 * deterministic and sub-millisecond. Lower distance is better.
 */
export function recommend(
  target: EmphasisVector,
  opts: { beginnerBias?: boolean } = {},
): Recommendation {
  let best: Recommendation | null = null;
  for (const config of candidates()) {
    const scores = scoreRaw(config);
    let distance = 0;
    for (const axis of SCORE_AXES) {
      const want = target[axis];
      const have = scores[axis] / 100;
      distance += want * (1 - have) * (1 - have);
    }
    if (opts.beginnerBias) {
      distance -= 1e-4 * (scores.forgiveness + scores.comfort);
    }
    if (!best || distance < best.distance) best = { config, scores, distance };
  }
  return best!;
}
