import type { ScoreAxis } from "@/lib/domain/score";

export interface QuizAnswers {
  level: "beginner" | "intermediate" | "advanced";
  style: "control" | "power" | "allRound" | "defensive";
  swing: "slowLight" | "moderate" | "fastStrong";
  pain: "mishits" | "lateSwings" | "armDiscomfort" | "lackPower" | "lackPrecision";
  preference: number; // 0 = learning-friendly .. 1 = performance-focused
}

export type EmphasisContribution = Partial<Record<ScoreAxis, number>>;

export interface QuizOption<K extends keyof QuizAnswers> {
  value: QuizAnswers[K];
  label: string;
  hint: string;
}

export interface QuizQuestion<K extends keyof QuizAnswers = keyof QuizAnswers> {
  key: K;
  prompt: string;
  options: QuizOption<K>[];
}

export const DEFAULT_ANSWERS: QuizAnswers = {
  level: "beginner",
  style: "allRound",
  swing: "moderate",
  pain: "mishits",
  preference: 0,
};

// Single-choice question metadata for the UI. `preference` is a slider, handled separately.
export const QUESTIONS: QuizQuestion[] = [
  {
    key: "level",
    prompt: "Where are you in your squash journey?",
    options: [
      { value: "beginner", label: "Beginner", hint: "New to the court" },
      { value: "intermediate", label: "Intermediate", hint: "Comfortable rallying" },
      { value: "advanced", label: "Advanced", hint: "Match-tested" },
    ],
  },
  {
    key: "style",
    prompt: "How do you like to play?",
    options: [
      { value: "control", label: "Control", hint: "Placement and touch" },
      { value: "power", label: "Power", hint: "Hit hard, finish fast" },
      { value: "allRound", label: "All-round", hint: "A bit of everything" },
      { value: "defensive", label: "Retrieval", hint: "Dig everything back" },
    ],
  },
  {
    key: "swing",
    prompt: "How would you describe your swing?",
    options: [
      { value: "slowLight", label: "Slow / light", hint: "Compact, controlled" },
      { value: "moderate", label: "Moderate", hint: "Balanced tempo" },
      { value: "fastStrong", label: "Fast / strong", hint: "Long, powerful" },
    ],
  },
  {
    key: "pain",
    prompt: "What frustrates you most right now?",
    options: [
      { value: "mishits", label: "Mishits", hint: "Off-center contact" },
      { value: "lateSwings", label: "Late swings", hint: "Rushed to the ball" },
      { value: "armDiscomfort", label: "Arm discomfort", hint: "Elbow / wrist strain" },
      { value: "lackPower", label: "Not enough power", hint: "Balls fall short" },
      { value: "lackPrecision", label: "Not enough precision", hint: "Loose length" },
    ],
  },
];

// Emphasis contributions per answer (additive; normalized later).
export const LEVEL_EMPHASIS: Record<QuizAnswers["level"], EmphasisContribution> = {
  beginner: { forgiveness: 3, comfort: 2, maneuverability: 1 },
  intermediate: { control: 1, maneuverability: 1, forgiveness: 1 },
  advanced: { control: 2, power: 1 },
};
export const STYLE_EMPHASIS: Record<QuizAnswers["style"], EmphasisContribution> = {
  control: { control: 3, comfort: 1 },
  power: { power: 3, control: 1 },
  allRound: { control: 1, power: 1, maneuverability: 1, forgiveness: 1, comfort: 1 },
  defensive: { maneuverability: 3, control: 1 },
};
export const SWING_EMPHASIS: Record<QuizAnswers["swing"], EmphasisContribution> = {
  slowLight: { maneuverability: 2, comfort: 1 },
  moderate: { control: 1, forgiveness: 1 },
  fastStrong: { power: 2, control: 1 },
};
export const PAIN_EMPHASIS: Record<QuizAnswers["pain"], EmphasisContribution> = {
  mishits: { forgiveness: 3, maneuverability: 1 },
  lateSwings: { maneuverability: 3 },
  armDiscomfort: { comfort: 3, forgiveness: 1 },
  lackPower: { power: 3 },
  lackPrecision: { control: 3 },
};
