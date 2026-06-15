import { SCORE_AXES, type ScoreAxis, type ScoreVector } from "@/lib/domain/score";
import {
  DEFAULT_CONFIG,
  clampTension,
  WEIGHT_CLASSES,
  type RacquetConfig,
  type Shape,
  type Balance,
  type GripSetup,
} from "@/lib/domain/config";
import { scoreRaw } from "./score";
import { SHAPE_DELTA, WEIGHT_DELTA, BALANCE_DELTA, GRIP_DELTA, TENSION_COEFF } from "./model";

const AXIS_LABEL: Record<ScoreAxis, string> = {
  power: "power",
  control: "control",
  maneuverability: "maneuverability",
  forgiveness: "forgiveness",
  comfort: "comfort",
};

const SHAPE_LABEL: Record<Shape, string> = {
  teardrop: "teardrop head",
  traditional: "traditional head",
  hybrid: "hybrid head",
};
const BALANCE_LABEL: Record<Balance, string> = {
  headLight: "head-light balance",
  even: "even balance",
  headHeavy: "head-heavy balance",
};
const GRIP_LABEL: Record<GripSetup, string> = {
  stock: "stock grip",
  thinOver: "thin overgrip",
  thickOver: "thick overgrip",
  tacky: "tacky grip",
};

interface Contribution {
  label: string;
  amount: number;
}

/** The changed variable contributing most to this axis's delta (or null if none changed). */
function attribute(prev: RacquetConfig, next: RacquetConfig, axis: ScoreAxis): string | null {
  const contributions: Contribution[] = [];

  if (prev.shape !== next.shape) {
    contributions.push({
      label: SHAPE_LABEL[next.shape],
      amount: SHAPE_DELTA[next.shape][axis] - SHAPE_DELTA[prev.shape][axis],
    });
  }
  if (prev.weightClass !== next.weightClass) {
    const heavier = WEIGHT_CLASSES.indexOf(next.weightClass) > WEIGHT_CLASSES.indexOf(prev.weightClass);
    contributions.push({
      label: heavier ? "heavier frame" : "lighter frame",
      amount: WEIGHT_DELTA[next.weightClass][axis] - WEIGHT_DELTA[prev.weightClass][axis],
    });
  }
  if (prev.balance !== next.balance) {
    contributions.push({
      label: BALANCE_LABEL[next.balance],
      amount: BALANCE_DELTA[next.balance][axis] - BALANCE_DELTA[prev.balance][axis],
    });
  }
  if (prev.grip !== next.grip) {
    contributions.push({
      label: GRIP_LABEL[next.grip],
      amount: GRIP_DELTA[next.grip][axis] - GRIP_DELTA[prev.grip][axis],
    });
  }
  const pt = clampTension(prev.stringTensionLb);
  const nt = clampTension(next.stringTensionLb);
  if (pt !== nt) {
    contributions.push({
      label: nt > pt ? "tighter strings" : "looser strings",
      amount: TENSION_COEFF[axis] * (nt - pt),
    });
  }

  if (contributions.length === 0) return null;
  contributions.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  return contributions[0].label;
}

function topDeltas(a: ScoreVector, b: ScoreVector, max: number) {
  return SCORE_AXES.map((axis) => ({ axis, delta: b[axis] - a[axis] }))
    .filter((d) => Math.abs(d.delta) >= 1)
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
    .slice(0, max);
}

/**
 * Plain-language bullets for the largest score changes between two configs, each
 * attributed to the variable that moved it most (spec §6.3).
 */
export function explain(prev: RacquetConfig, next: RacquetConfig, max = 3): string[] {
  const deltas = topDeltas(scoreRaw(prev), scoreRaw(next), max);
  return deltas.map((d) => {
    const dir = d.delta > 0 ? "More" : "Less";
    const sign = d.delta > 0 ? "+" : "";
    const cause = attribute(prev, next, d.axis);
    const head = `${dir} ${AXIS_LABEL[d.axis]} (${sign}${Math.round(d.delta)})`;
    return cause ? `${head} · ${cause}` : head;
  });
}

/** Standalone summary of a build vs. the neutral baseline. */
export function describe(config: RacquetConfig): string[] {
  return explain(DEFAULT_CONFIG, config, 3);
}
