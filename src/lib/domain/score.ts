export type ScoreAxis = "power" | "control" | "maneuverability" | "forgiveness" | "comfort";

export const SCORE_AXES: ScoreAxis[] = [
  "power",
  "control",
  "maneuverability",
  "forgiveness",
  "comfort",
];

export type ScoreVector = Record<ScoreAxis, number>;
