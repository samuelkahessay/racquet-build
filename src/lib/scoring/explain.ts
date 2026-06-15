import { SCORE_AXES, type ScoreAxis, type ScoreVector } from "@/lib/domain/score";
import { DEFAULT_CONFIG, type RacquetConfig } from "@/lib/domain/config";
import { scoreRaw } from "./score";

const LABEL: Record<ScoreAxis, string> = {
  power: "power",
  control: "control",
  maneuverability: "maneuverability",
  forgiveness: "forgiveness",
  comfort: "comfort",
};

function topDeltas(a: ScoreVector, b: ScoreVector, max: number) {
  return SCORE_AXES.map((axis) => ({ axis, delta: b[axis] - a[axis] }))
    .filter((d) => Math.abs(d.delta) >= 1)
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
    .slice(0, max);
}

/** Plain-language bullets for the largest score changes between two configs. */
export function explain(prev: RacquetConfig, next: RacquetConfig, max = 3): string[] {
  const deltas = topDeltas(scoreRaw(prev), scoreRaw(next), max);
  return deltas.map((d) => {
    const dir = d.delta > 0 ? "More" : "Less";
    const sign = d.delta > 0 ? "+" : "";
    return `${dir} ${LABEL[d.axis]} (${sign}${Math.round(d.delta)})`;
  });
}

/** Standalone summary of a build vs. the neutral baseline. */
export function describe(config: RacquetConfig): string[] {
  return explain(DEFAULT_CONFIG, config, 3);
}
