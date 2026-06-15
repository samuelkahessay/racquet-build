import { SCORE_AXES, type ScoreAxis } from "@/lib/domain/score";
import type { EmphasisVector } from "@/lib/scoring/recommend";
import {
  type QuizAnswers,
  type EmphasisContribution,
  LEVEL_EMPHASIS,
  STYLE_EMPHASIS,
  SWING_EMPHASIS,
  PAIN_EMPHASIS,
} from "./questions";

function add(into: Record<ScoreAxis, number>, c: EmphasisContribution, scale = 1) {
  for (const axis of SCORE_AXES) into[axis] += (c[axis] ?? 0) * scale;
}

/** Map quiz answers to a normalized emphasis vector (sums to 1). */
export function quizToEmphasis(a: QuizAnswers): EmphasisVector {
  const acc: Record<ScoreAxis, number> = {
    power: 0,
    control: 0,
    maneuverability: 0,
    forgiveness: 0,
    comfort: 0,
  };
  add(acc, LEVEL_EMPHASIS[a.level]);
  add(acc, STYLE_EMPHASIS[a.style]);
  add(acc, SWING_EMPHASIS[a.swing]);
  add(acc, PAIN_EMPHASIS[a.pain]);

  // preference slider tilts performance (power+control) vs learning (forgiveness+comfort)
  const perf = Math.max(0, Math.min(1, a.preference));
  add(acc, { power: 2, control: 1 }, perf);
  add(acc, { forgiveness: 2, comfort: 1 }, 1 - perf);

  const sum = SCORE_AXES.reduce((s, ax) => s + acc[ax], 0) || 1;
  const out = {} as EmphasisVector;
  for (const axis of SCORE_AXES) out[axis] = acc[axis] / sum;
  return out;
}
