# RacquetBuild MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the RacquetBuild MVP per [`docs/spec.md`](../../spec.md): a deterministic 5-axis scoring engine, a fit quiz, a live configuration simulator, a stylized blueprint 3D preview, and URL-encoded shareable builds — deployed to Vercel.

**Architecture:** A pure, framework-agnostic core in `src/lib/` (domain model, scoring engine, recommender, quiz mapping, share codec) consumed by Next.js 16 App Router routes and React client islands. A single Zustand store bridges the pure core to the UI and is the only writer of the `?c=` URL state. The 3D preview is a lazy R3F island. No backend, DB, or auth.

**Tech Stack:** Next.js 16.2.9 (App Router), React 19, TypeScript, Tailwind v4, Zustand, Three.js + React Three Fiber + drei, Vitest (added here), lucide-react.

> **Next 16 note (`AGENTS.md`):** Before writing route/`searchParams`/`next/navigation` code, read the relevant guide under `node_modules/next/dist/docs/`. Verify the async `searchParams` access pattern and client navigation hooks rather than relying on training data.

---

## File Structure

```
src/lib/domain/config.ts        # RacquetConfig, enums, ranges, DEFAULT_CONFIG, clampTension
src/lib/domain/score.ts         # ScoreAxis, SCORE_AXES, ScoreVector
src/lib/scoring/model.ts        # coefficient tables (the tunable model)
src/lib/scoring/score.ts        # scoreRaw(), score()
src/lib/scoring/explain.ts      # explain(prev,next), describe(config)
src/lib/scoring/recommend.ts    # EmphasisVector, recommend()
src/lib/quiz/questions.ts       # QuizAnswers type + question/option metadata
src/lib/quiz/emphasis.ts        # quizToEmphasis()
src/lib/share/codec.ts          # encodeConfig(), decodeConfig()
src/lib/state/store.ts          # Zustand store + selectors + URL sync helper
src/components/ui/*             # SegmentedControl, TensionSlider, ReadoutBar, RadarPlot, SpecPlate
src/components/simulator/*      # Workbench composition
src/components/quiz/*           # QuizStepper, QuizResult
src/components/preview3d/*      # RacquetBlueprint (R3F, lazy)
src/app/{layout,page,globals.css}, src/app/{quiz,build,about}/page.tsx
```

Test files live next to source as `*.test.ts` under `src/` (Vitest `include` covers `src/**`).

---

## Task 1: Test infrastructure (Vitest)

**Files:**
- Modify: `package.json` (add devDeps + scripts)
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

Run: `npm i -D vitest@^3` — wait for completion.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 3: Add scripts to `package.json`**

Add to `"scripts"`: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 4: Verify runner works**

Run: `npm test` — Expected: exits 0 with "No test files found" (acceptable until Task 2).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "test: add vitest with @ alias for unit tests"
```

---

## Task 2: Domain model

**Files:**
- Create: `src/lib/domain/config.ts`, `src/lib/domain/score.ts`
- Test: `src/lib/domain/config.test.ts`

- [ ] **Step 1: Write the failing test** — `src/lib/domain/config.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { DEFAULT_CONFIG, clampTension, TENSION_MIN, TENSION_MAX, SHAPES } from "./config";

describe("domain/config", () => {
  it("default config is the neutral center", () => {
    expect(DEFAULT_CONFIG).toEqual({
      shape: "hybrid", weightClass: "medium", balance: "even",
      stringTensionLb: 26, grip: "stock",
    });
  });
  it("clampTension clamps and rounds", () => {
    expect(clampTension(10)).toBe(TENSION_MIN);
    expect(clampTension(99)).toBe(TENSION_MAX);
    expect(clampTension(25.6)).toBe(26);
  });
  it("enumerates all shapes", () => {
    expect(SHAPES).toEqual(["teardrop", "traditional", "hybrid"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npm test` — Expected: FAIL (cannot find module `./config`).

- [ ] **Step 3: Write `src/lib/domain/config.ts`**

```ts
export type Shape = "teardrop" | "traditional" | "hybrid";
export type WeightClass = "light" | "medium" | "heavy";
export type Balance = "headLight" | "even" | "headHeavy";
export type GripSetup = "stock" | "thinOver" | "thickOver" | "tacky";

export interface RacquetConfig {
  shape: Shape;
  weightClass: WeightClass;
  balance: Balance;
  stringTensionLb: number; // integer lb within [TENSION_MIN, TENSION_MAX]
  grip: GripSetup;
}

export const TENSION_MIN = 18;
export const TENSION_MAX = 32;
export const TENSION_PIVOT = 26;

export const SHAPES: Shape[] = ["teardrop", "traditional", "hybrid"];
export const WEIGHT_CLASSES: WeightClass[] = ["light", "medium", "heavy"];
export const BALANCES: Balance[] = ["headLight", "even", "headHeavy"];
export const GRIPS: GripSetup[] = ["stock", "thinOver", "thickOver", "tacky"];

export const DEFAULT_CONFIG: RacquetConfig = {
  shape: "hybrid",
  weightClass: "medium",
  balance: "even",
  stringTensionLb: 26,
  grip: "stock",
};

export function clampTension(lb: number): number {
  return Math.max(TENSION_MIN, Math.min(TENSION_MAX, Math.round(lb)));
}
```

- [ ] **Step 4: Write `src/lib/domain/score.ts`**

```ts
export type ScoreAxis = "power" | "control" | "maneuverability" | "forgiveness" | "comfort";
export const SCORE_AXES: ScoreAxis[] = ["power", "control", "maneuverability", "forgiveness", "comfort"];
export type ScoreVector = Record<ScoreAxis, number>;
```

- [ ] **Step 5: Run test to verify it passes** — Run: `npm test` — Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/domain
git commit -m "feat(domain): add racquet config + score axis model"
```

---

## Task 3: Scoring engine — model tables + `score()`

**Files:**
- Create: `src/lib/scoring/model.ts`, `src/lib/scoring/score.ts`
- Test: `src/lib/scoring/score.test.ts`

- [ ] **Step 1: Write the failing test** — `src/lib/scoring/score.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { score, scoreRaw } from "./score";
import { DEFAULT_CONFIG, type RacquetConfig } from "@/lib/domain/config";
import { SCORE_AXES } from "@/lib/domain/score";

describe("scoring/score", () => {
  it("neutral default scores 50 on every axis", () => {
    const s = score(DEFAULT_CONFIG);
    for (const axis of SCORE_AXES) expect(s[axis]).toBe(50);
  });

  it("clamps to [0,100]", () => {
    const extreme: RacquetConfig = {
      shape: "teardrop", weightClass: "light", balance: "headLight",
      stringTensionLb: 18, grip: "thickOver",
    };
    const s = scoreRaw(extreme);
    for (const axis of SCORE_AXES) {
      expect(s[axis]).toBeGreaterThanOrEqual(0);
      expect(s[axis]).toBeLessThanOrEqual(100);
    }
  });

  it("higher tension never increases power; lower never increases control", () => {
    const base = { ...DEFAULT_CONFIG, stringTensionLb: 26 };
    const tighter = { ...base, stringTensionLb: 30 };
    const looser = { ...base, stringTensionLb: 22 };
    expect(scoreRaw(tighter).power).toBeLessThan(scoreRaw(base).power);
    expect(scoreRaw(looser).control).toBeLessThan(scoreRaw(base).control);
  });

  it("heavier reduces maneuverability; head-heavy reduces maneuverability", () => {
    expect(scoreRaw({ ...DEFAULT_CONFIG, weightClass: "heavy" }).maneuverability)
      .toBeLessThan(scoreRaw(DEFAULT_CONFIG).maneuverability);
    expect(scoreRaw({ ...DEFAULT_CONFIG, balance: "headHeavy" }).maneuverability)
      .toBeLessThan(scoreRaw(DEFAULT_CONFIG).maneuverability);
  });

  it("display scores are integers", () => {
    const s = score({ ...DEFAULT_CONFIG, stringTensionLb: 23 });
    for (const axis of SCORE_AXES) expect(Number.isInteger(s[axis])).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npm test` — Expected: FAIL (cannot find `./score`).

- [ ] **Step 3: Write `src/lib/scoring/model.ts`**

```ts
import type { Shape, WeightClass, Balance, GripSetup } from "@/lib/domain/config";
import type { ScoreVector } from "@/lib/domain/score";

export const BASELINE = 50;

// Each row: additive deltas applied to the 50 baseline. Tune here only (spec §6.2).
export const SHAPE_DELTA: Record<Shape, ScoreVector> = {
  teardrop:    { power: 18,  control: -12, maneuverability: 4,  forgiveness: 14,  comfort: 2 },
  traditional: { power: -10, control: 18,  maneuverability: 6,  forgiveness: -12, comfort: -2 },
  hybrid:      { power: 4,   control: 4,   maneuverability: 5,  forgiveness: 2,   comfort: 0 },
};

export const WEIGHT_DELTA: Record<WeightClass, ScoreVector> = {
  light:  { power: -8, control: -4, maneuverability: 20,  forgiveness: -6, comfort: 4 },
  medium: { power: 0,  control: 0,  maneuverability: 0,   forgiveness: 0,  comfort: 0 },
  heavy:  { power: 16, control: 8,  maneuverability: -20, forgiveness: 8,  comfort: -6 },
};

export const BALANCE_DELTA: Record<Balance, ScoreVector> = {
  headLight: { power: -8, control: 4,  maneuverability: 16,  forgiveness: -2, comfort: 4 },
  even:      { power: 0,  control: 0,  maneuverability: 0,   forgiveness: 0,  comfort: 0 },
  headHeavy: { power: 14, control: -2, maneuverability: -16, forgiveness: 6,  comfort: -4 },
};

export const GRIP_DELTA: Record<GripSetup, ScoreVector> = {
  stock:     { power: 0, control: 0,  maneuverability: 0,  forgiveness: 0, comfort: 0 },
  thinOver:  { power: 0, control: 4,  maneuverability: 1,  forgiveness: 0, comfort: 2 },
  thickOver: { power: 2, control: -4, maneuverability: -1, forgiveness: 3, comfort: 6 },
  tacky:     { power: 0, control: 5,  maneuverability: 0,  forgiveness: 0, comfort: 3 },
};

// Per-lb effect relative to TENSION_PIVOT (26). Lower tension trades control for power/comfort.
export const TENSION_COEFF: ScoreVector = {
  power: -2.2, control: 2.0, maneuverability: 0, forgiveness: -1.0, comfort: -1.6,
};
```

- [ ] **Step 4: Write `src/lib/scoring/score.ts`**

```ts
import { SCORE_AXES, type ScoreVector } from "@/lib/domain/score";
import { TENSION_PIVOT, type RacquetConfig } from "@/lib/domain/config";
import { SHAPE_DELTA, WEIGHT_DELTA, BALANCE_DELTA, GRIP_DELTA, TENSION_COEFF, BASELINE } from "./model";

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** Pure, deterministic: config -> raw (unrounded, clamped) score vector. */
export function scoreRaw(c: RacquetConfig): ScoreVector {
  const out = {} as ScoreVector;
  for (const axis of SCORE_AXES) {
    out[axis] = clamp(
      BASELINE +
        SHAPE_DELTA[c.shape][axis] +
        WEIGHT_DELTA[c.weightClass][axis] +
        BALANCE_DELTA[c.balance][axis] +
        GRIP_DELTA[c.grip][axis] +
        TENSION_COEFF[axis] * (c.stringTensionLb - TENSION_PIVOT),
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
```

- [ ] **Step 5: Run test to verify it passes** — Run: `npm test` — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/scoring/model.ts src/lib/scoring/score.ts src/lib/scoring/score.test.ts
git commit -m "feat(scoring): add deterministic heuristic scoring engine"
```

---

## Task 4: Explanation generator — `explain()` / `describe()`

**Files:**
- Create: `src/lib/scoring/explain.ts`
- Test: `src/lib/scoring/explain.test.ts`

- [ ] **Step 1: Write the failing test** — `src/lib/scoring/explain.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { explain, describe as describeConfig } from "./explain";
import { DEFAULT_CONFIG } from "@/lib/domain/config";

describe("scoring/explain", () => {
  it("returns no bullets when nothing changes", () => {
    expect(explain(DEFAULT_CONFIG, DEFAULT_CONFIG)).toEqual([]);
  });
  it("leads with the largest score change and notes direction", () => {
    const next = { ...DEFAULT_CONFIG, weightClass: "heavy" as const };
    const bullets = explain(DEFAULT_CONFIG, next);
    expect(bullets.length).toBeGreaterThan(0);
    // heaviest delta for medium->heavy is maneuverability (-20)
    expect(bullets[0].toLowerCase()).toContain("maneuverability");
    expect(bullets[0].toLowerCase()).toContain("less");
  });
  it("caps the number of bullets", () => {
    const next = { shape: "teardrop", weightClass: "light", balance: "headLight",
      stringTensionLb: 20, grip: "thickOver" } as const;
    expect(explain(DEFAULT_CONFIG, next).length).toBeLessThanOrEqual(3);
  });
  it("describe returns a non-empty summary for a non-neutral build", () => {
    expect(describeConfig({ ...DEFAULT_CONFIG, shape: "teardrop" }).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npm test` — Expected: FAIL.

- [ ] **Step 3: Write `src/lib/scoring/explain.ts`**

```ts
import { SCORE_AXES, type ScoreAxis, type ScoreVector } from "@/lib/domain/score";
import { DEFAULT_CONFIG, type RacquetConfig } from "@/lib/domain/config";
import { scoreRaw } from "./score";

const LABEL: Record<ScoreAxis, string> = {
  power: "power", control: "control", maneuverability: "maneuverability",
  forgiveness: "forgiveness", comfort: "comfort",
};

function topDeltas(a: ScoreVector, b: ScoreVector, max: number) {
  return SCORE_AXES
    .map((axis) => ({ axis, delta: b[axis] - a[axis] }))
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
```

- [ ] **Step 4: Run test to verify it passes** — Run: `npm test` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring/explain.ts src/lib/scoring/explain.test.ts
git commit -m "feat(scoring): add explanation + describe generators"
```

---

## Task 5: Recommender — `recommend()`

**Files:**
- Create: `src/lib/scoring/recommend.ts`
- Test: `src/lib/scoring/recommend.test.ts`

- [ ] **Step 1: Write the failing test** — `src/lib/scoring/recommend.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { recommend, type EmphasisVector } from "./recommend";

const emphasis = (partial: Partial<EmphasisVector>): EmphasisVector => {
  const base: EmphasisVector = { power: 0, control: 0, maneuverability: 0, forgiveness: 0, comfort: 0 };
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
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npm test` — Expected: FAIL.

- [ ] **Step 3: Write `src/lib/scoring/recommend.ts`**

```ts
import {
  SHAPES, WEIGHT_CLASSES, BALANCES, GRIPS, TENSION_MIN, TENSION_MAX,
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
 * Inverse model: pick the build whose normalized scores best satisfy the
 * emphasis target (treated as "maximize these axes"). Brute force over the
 * 864-candidate grid — deterministic, <1ms. Lower distance is better.
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
```

- [ ] **Step 4: Run test to verify it passes** — Run: `npm test` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring/recommend.ts src/lib/scoring/recommend.test.ts
git commit -m "feat(scoring): add inverse-model build recommender"
```

---

## Task 6: Quiz → emphasis mapping

**Files:**
- Create: `src/lib/quiz/questions.ts`, `src/lib/quiz/emphasis.ts`
- Test: `src/lib/quiz/emphasis.test.ts`

- [ ] **Step 1: Write the failing test** — `src/lib/quiz/emphasis.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { quizToEmphasis } from "./emphasis";
import type { QuizAnswers } from "./questions";

const answers = (p: Partial<QuizAnswers> = {}): QuizAnswers => ({
  level: "beginner", style: "allRound", swing: "moderate",
  pain: "mishits", preference: 0, ...p,
});

describe("quiz/emphasis", () => {
  it("emphasis weights are non-negative and sum to ~1", () => {
    const e = quizToEmphasis(answers());
    const sum = Object.values(e).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(1e-6);
    for (const v of Object.values(e)) expect(v).toBeGreaterThanOrEqual(0);
  });
  it("mishits + beginner emphasizes forgiveness over power", () => {
    const e = quizToEmphasis(answers({ pain: "mishits" }));
    expect(e.forgiveness).toBeGreaterThan(e.power);
  });
  it("power style + fast swing emphasizes power", () => {
    const e = quizToEmphasis(answers({ style: "power", swing: "fastStrong", pain: "lackPower" }));
    expect(e.power).toBeGreaterThan(e.forgiveness);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npm test` — Expected: FAIL.

- [ ] **Step 3: Write `src/lib/quiz/questions.ts`**

```ts
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
  level: "beginner", style: "allRound", swing: "moderate", pain: "mishits", preference: 0,
};

// Question metadata for the UI. `preference` is a slider, handled separately.
export const QUESTIONS: QuizQuestion[] = [
  { key: "level", prompt: "Where are you in your squash journey?", options: [
    { value: "beginner", label: "Beginner", hint: "New to the court" },
    { value: "intermediate", label: "Intermediate", hint: "Comfortable rallying" },
    { value: "advanced", label: "Advanced", hint: "Match-tested" },
  ]},
  { key: "style", prompt: "How do you like to play?", options: [
    { value: "control", label: "Control", hint: "Placement and touch" },
    { value: "power", label: "Power", hint: "Hit hard, finish fast" },
    { value: "allRound", label: "All-round", hint: "A bit of everything" },
    { value: "defensive", label: "Retrieval", hint: "Dig everything back" },
  ]},
  { key: "swing", prompt: "How would you describe your swing?", options: [
    { value: "slowLight", label: "Slow / light", hint: "Compact, controlled" },
    { value: "moderate", label: "Moderate", hint: "Balanced tempo" },
    { value: "fastStrong", label: "Fast / strong", hint: "Long, powerful" },
  ]},
  { key: "pain", prompt: "What frustrates you most right now?", options: [
    { value: "mishits", label: "Mishits", hint: "Off-center contact" },
    { value: "lateSwings", label: "Late swings", hint: "Rushed to the ball" },
    { value: "armDiscomfort", label: "Arm discomfort", hint: "Elbow/wrist strain" },
    { value: "lackPower", label: "Not enough power", hint: "Balls fall short" },
    { value: "lackPrecision", label: "Not enough precision", hint: "Loose length" },
  ]},
];

// Emphasis contributions per answer (additive, normalized later).
export const LEVEL_EMPHASIS: Record<QuizAnswers["level"], EmphasisContribution> = {
  beginner:     { forgiveness: 3, comfort: 2, maneuverability: 1 },
  intermediate: { control: 1, maneuverability: 1, forgiveness: 1 },
  advanced:     { control: 2, power: 1 },
};
export const STYLE_EMPHASIS: Record<QuizAnswers["style"], EmphasisContribution> = {
  control:   { control: 3, comfort: 1 },
  power:     { power: 3, control: 1 },
  allRound:  { control: 1, power: 1, maneuverability: 1, forgiveness: 1, comfort: 1 },
  defensive: { maneuverability: 3, control: 1 },
};
export const SWING_EMPHASIS: Record<QuizAnswers["swing"], EmphasisContribution> = {
  slowLight:  { maneuverability: 2, comfort: 1 },
  moderate:   { control: 1, forgiveness: 1 },
  fastStrong: { power: 2, control: 1 },
};
export const PAIN_EMPHASIS: Record<QuizAnswers["pain"], EmphasisContribution> = {
  mishits:       { forgiveness: 3, maneuverability: 1 },
  lateSwings:    { maneuverability: 3 },
  armDiscomfort: { comfort: 3, forgiveness: 1 },
  lackPower:     { power: 3 },
  lackPrecision: { control: 3 },
};
```

- [ ] **Step 4: Write `src/lib/quiz/emphasis.ts`**

```ts
import { SCORE_AXES, type ScoreAxis } from "@/lib/domain/score";
import type { EmphasisVector } from "@/lib/scoring/recommend";
import {
  type QuizAnswers, type EmphasisContribution,
  LEVEL_EMPHASIS, STYLE_EMPHASIS, SWING_EMPHASIS, PAIN_EMPHASIS,
} from "./questions";

function add(into: Record<ScoreAxis, number>, c: EmphasisContribution, scale = 1) {
  for (const axis of SCORE_AXES) into[axis] += (c[axis] ?? 0) * scale;
}

/** Map quiz answers to a normalized emphasis vector (sums to 1). */
export function quizToEmphasis(a: QuizAnswers): EmphasisVector {
  const acc: Record<ScoreAxis, number> = {
    power: 0, control: 0, maneuverability: 0, forgiveness: 0, comfort: 0,
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
```

- [ ] **Step 5: Run test to verify it passes** — Run: `npm test` — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/quiz
git commit -m "feat(quiz): map quiz answers to scoring emphasis"
```

---

## Task 7: Share codec — `encodeConfig()` / `decodeConfig()`

**Files:**
- Create: `src/lib/share/codec.ts`
- Test: `src/lib/share/codec.test.ts`

- [ ] **Step 1: Write the failing test** — `src/lib/share/codec.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { encodeConfig, decodeConfig } from "./codec";
import {
  DEFAULT_CONFIG, SHAPES, WEIGHT_CLASSES, BALANCES, GRIPS,
  TENSION_MIN, TENSION_MAX, type RacquetConfig,
} from "@/lib/domain/config";

describe("share/codec", () => {
  it("round-trips the default config", () => {
    expect(decodeConfig(encodeConfig(DEFAULT_CONFIG))).toEqual(DEFAULT_CONFIG);
  });
  it("round-trips the full matrix", () => {
    for (const shape of SHAPES)
      for (const weightClass of WEIGHT_CLASSES)
        for (const balance of BALANCES)
          for (const grip of GRIPS)
            for (const t of [TENSION_MIN, 26, TENSION_MAX]) {
              const cfg: RacquetConfig = { shape, weightClass, balance, grip, stringTensionLb: t };
              expect(decodeConfig(encodeConfig(cfg))).toEqual(cfg);
            }
  });
  it("returns null for malformed input", () => {
    for (const bad of ["", "garbage", "9.h.m.e.s.26", "1.x.m.e.s.26", "1.h.m.e.s.99", "1.h.m.e.s"]) {
      expect(decodeConfig(bad)).toBeNull();
    }
  });
  it("produces a short URL-safe token", () => {
    const token = encodeConfig(DEFAULT_CONFIG);
    expect(token).toMatch(/^[A-Za-z0-9.\-]+$/);
    expect(token.length).toBeLessThan(20);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npm test` — Expected: FAIL.

- [ ] **Step 3: Write `src/lib/share/codec.ts`**

```ts
import {
  clampTension, TENSION_MIN, TENSION_MAX,
  type RacquetConfig, type Shape, type WeightClass, type Balance, type GripSetup,
} from "@/lib/domain/config";

const VERSION = "1";

const SHAPE_CODE: Record<Shape, string> = { teardrop: "t", traditional: "r", hybrid: "h" };
const WEIGHT_CODE: Record<WeightClass, string> = { light: "l", medium: "m", heavy: "y" };
const BALANCE_CODE: Record<Balance, string> = { headLight: "l", even: "e", headHeavy: "v" };
const GRIP_CODE: Record<GripSetup, string> = { stock: "s", thinOver: "t", thickOver: "k", tacky: "c" };

const invert = <T extends string>(m: Record<T, string>) =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as Record<string, T>;

const SHAPE_FROM = invert(SHAPE_CODE);
const WEIGHT_FROM = invert(WEIGHT_CODE);
const BALANCE_FROM = invert(BALANCE_CODE);
const GRIP_FROM = invert(GRIP_CODE);

/** Versioned, delimited, URL-safe token: `1.<shape>.<weight>.<balance>.<grip>.<tension>`. */
export function encodeConfig(c: RacquetConfig): string {
  return [
    VERSION,
    SHAPE_CODE[c.shape],
    WEIGHT_CODE[c.weightClass],
    BALANCE_CODE[c.balance],
    GRIP_CODE[c.grip],
    String(clampTension(c.stringTensionLb)),
  ].join(".");
}

/** Parse a token back to a config, or null if anything is invalid. Never throws. */
export function decodeConfig(token: string | null | undefined): RacquetConfig | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 6) return null;
  const [v, s, w, b, g, tRaw] = parts;
  if (v !== VERSION) return null;

  const shape = SHAPE_FROM[s];
  const weightClass = WEIGHT_FROM[w];
  const balance = BALANCE_FROM[b];
  const grip = GRIP_FROM[g];
  if (!shape || !weightClass || !balance || !grip) return null;

  if (!/^\d{1,2}$/.test(tRaw)) return null;
  const stringTensionLb = Number(tRaw);
  if (stringTensionLb < TENSION_MIN || stringTensionLb > TENSION_MAX) return null;

  return { shape, weightClass, balance, grip, stringTensionLb };
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `npm test` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/share
git commit -m "feat(share): add versioned URL-safe config codec"
```

---

## Checkpoint A — Codex backend review

After Tasks 2–7, the entire pure core (`src/lib/`) is implemented and green. Run the
**codex gpt-5.5 xhigh** review over `src/lib/` for correctness and optimization
(spec §6, §10, §15). Triage findings; apply vetted ones as small follow-up commits with
new/updated tests. Then re-run `npm test` to confirm green before UI work.

Command shape (non-interactive, high reasoning):
```bash
codex exec --model gpt-5.5 -c model_reasoning_effort=xhigh "<review prompt>"
```

---

## Task 8: Blueprint design tokens

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Define tokens (spec §11.2)** in `src/app/globals.css`: graphite/ink surface
  scale, blueprint-grid line color + tick color, ink/label text colors, one cyan signal
  accent + one amber emphasis accent, mono + sans font vars (Geist already wired), tabular
  numerals utility, an 8px spacing scale, and a reusable faint blueprint-grid background
  (CSS gradient lines). Expose them through the Tailwind v4 `@theme inline` block so
  utilities like `bg-surface`, `text-ink`, `border-hairline`, `text-signal` exist.

- [ ] **Step 2: Apply the grid backdrop + base ink/surface in `body`** (dark technical canvas).

- [ ] **Step 3: Verify** — Run: `npm run dev`, load `/` — Expected: dark blueprint canvas with faint grid, no console errors. (Landing content still the scaffold — replaced in Task 14.)

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "style(theme): add blueprint/factory design tokens"
```

> **Skill:** invoke `frontend-design` to generate the concrete token values and grid
> treatment within these constraints; keep the anti-slop checklist (spec §11.3) in force.

---

## Task 9: UI primitives

**Files:**
- Create: `src/components/ui/SegmentedControl.tsx`, `TensionSlider.tsx`, `ReadoutBar.tsx`, `RadarPlot.tsx`, `SpecPlate.tsx`

Each is a presentational client component with an explicit prop contract. No chart
library — `RadarPlot` and `ReadoutBar` are hand-rolled SVG (spec §13).

- [ ] **Step 1: `SegmentedControl<T>`** — props `{ label: string; value: T; options: {value:T; label:string; hint?:string}[]; onChange:(v:T)=>void; name:string }`. Radio-group semantics (`role="radiogroup"`, arrow-key nav, `aria-checked`), tick-mark active state in the signal accent, monospace labels.

- [ ] **Step 2: `TensionSlider`** — props `{ value:number; min:number; max:number; onChange:(v:number)=>void; lowMax:number; highMin:number }`. Native `<input type=range>` styled as a measured track with tick marks at the low/medium/high boundaries and a tabular-numeral lb readout; keyboard accessible; respects `prefers-reduced-motion`.

- [ ] **Step 3: `ReadoutBar`** — props `{ axis:string; value:number /*0..100*/; animate:boolean }`. Horizontal instrument bar with axis label (mono), tabular-numeral value, and a fill in the signal accent; count-up on change unless reduced motion.

- [ ] **Step 4: `RadarPlot`** — props `{ scores: ScoreVector; size?:number }`. SVG pentagon/radar with 5 labeled axes, gridline rings, and the score polygon; decorative (`aria-hidden`) since `ReadoutBar`s carry the values.

- [ ] **Step 5: `SpecPlate`** — props `{ config: RacquetConfig; shareUrl:string; onCopy:()=>void; onReset:()=>void }`. A "drawing title block": the five chosen variables in a bordered mono table, the share URL as selectable text, a Copy button (Clipboard API + visible confirmation), and Reset.

- [ ] **Step 6: Verify** — Render each in `/build` (Task 11) or a scratch route; confirm keyboard operation and no a11y violations in the browser.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui
git commit -m "feat(ui): add blueprint segmented control, slider, readouts, radar, spec plate"
```

> **Skill:** invoke `frontend-design` for the visual execution of these primitives within
> the Task 8 token system; then `polish` for alignment/spacing/detail.

---

## Task 10: Zustand store + URL sync

**Files:**
- Create: `src/lib/state/store.ts`
- Test: `src/lib/state/store.test.ts`

- [ ] **Step 1: Write the failing test** — `src/lib/state/store.test.ts`

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useBuildStore } from "./store";
import { DEFAULT_CONFIG } from "@/lib/domain/config";
import { encodeConfig } from "@/lib/share/codec";

describe("state/store", () => {
  beforeEach(() => useBuildStore.getState().reset());

  it("starts at default config with derived scores", () => {
    const s = useBuildStore.getState();
    expect(s.config).toEqual(DEFAULT_CONFIG);
    expect(s.scores().power).toBe(50);
  });
  it("setField updates config and prev for explanation", () => {
    useBuildStore.getState().setField("weightClass", "heavy");
    const s = useBuildStore.getState();
    expect(s.config.weightClass).toBe("heavy");
    expect(s.explanation()[0].toLowerCase()).toContain("maneuverability");
  });
  it("hydrate accepts a valid token and ignores junk", () => {
    const token = encodeConfig({ ...DEFAULT_CONFIG, shape: "teardrop" });
    useBuildStore.getState().hydrateFromToken(token);
    expect(useBuildStore.getState().config.shape).toBe("teardrop");
    useBuildStore.getState().hydrateFromToken("garbage");
    expect(useBuildStore.getState().config.shape).toBe("teardrop"); // unchanged
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npm test` — Expected: FAIL.

- [ ] **Step 3: Write `src/lib/state/store.ts`**

```ts
import { create } from "zustand";
import {
  DEFAULT_CONFIG, clampTension, type RacquetConfig,
} from "@/lib/domain/config";
import { score } from "@/lib/scoring/score";
import { explain } from "@/lib/scoring/explain";
import type { ScoreVector } from "@/lib/domain/score";
import { encodeConfig, decodeConfig } from "@/lib/share/codec";

interface BuildState {
  config: RacquetConfig;
  prev: RacquetConfig;
  setField: <K extends keyof RacquetConfig>(key: K, value: RacquetConfig[K]) => void;
  setConfig: (config: RacquetConfig) => void;
  hydrateFromToken: (token: string | null | undefined) => void;
  reset: () => void;
  // derived
  scores: () => ScoreVector;
  explanation: () => string[];
  token: () => string;
}

export const useBuildStore = create<BuildState>((set, get) => ({
  config: DEFAULT_CONFIG,
  prev: DEFAULT_CONFIG,
  setField: (key, value) =>
    set((s) => {
      const next = { ...s.config, [key]: key === "stringTensionLb" ? clampTension(value as number) : value };
      return { prev: s.config, config: next };
    }),
  setConfig: (config) => set((s) => ({ prev: s.config, config })),
  hydrateFromToken: (token) => {
    const decoded = decodeConfig(token);
    if (decoded) set({ config: decoded, prev: decoded });
  },
  reset: () => set({ config: DEFAULT_CONFIG, prev: DEFAULT_CONFIG }),
  scores: () => score(get().config),
  explanation: () => explain(get().prev, get().config),
  token: () => encodeConfig(get().config),
}));
```

- [ ] **Step 4: Run test to verify it passes** — Run: `npm test` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/state
git commit -m "feat(state): add zustand build store with derived scores"
```

---

## Task 11: Simulator workbench (`/build`)

**Files:**
- Create: `src/components/simulator/Workbench.tsx`, `src/app/build/page.tsx`

- [ ] **Step 1: `Workbench.tsx`** (client) — composes Task 9 primitives + Task 10 store: a controls column (Shape/Weight/Balance segmented controls, TensionSlider, Grip segmented control), a readouts column (five `ReadoutBar`s + `RadarPlot`), the "what changed and why" panel from `store.explanation()`, the lazy 3D preview (Task 13), and the `SpecPlate`. On any change, write `?c=store.token()` via `history.replaceState`/router shallow update (debounced ~150ms, no scroll). On mount, read `?c=` and call `hydrateFromToken`.

- [ ] **Step 2: `src/app/build/page.tsx`** — server component shell (title block header, blueprint frame) rendering `<Workbench/>`. Read initial `?c=` from `searchParams` (Next 16 async pattern — verify in `node_modules/next/dist/docs/`) and pass as `initialToken` prop so first paint matches the link.

- [ ] **Step 3: Verify** — Run: `npm run dev`; open `/build`, change controls → scores + explanation update, URL `?c=` updates; reload with that URL → same build restored. Open `/build?c=1.t.l.v.c.20` → loads that build. Use the `browse`/`qa` skill to confirm.

- [ ] **Step 4: Commit**

```bash
git add src/components/simulator src/app/build
git commit -m "feat(simulator): add live workbench with URL-synced build state"
```

---

## Task 12: Fit quiz (`/quiz`)

**Files:**
- Create: `src/components/quiz/QuizStepper.tsx`, `src/components/quiz/QuizResult.tsx`, `src/app/quiz/page.tsx`

- [ ] **Step 1: `QuizStepper.tsx`** (client) — renders `QUESTIONS` (Task 6) one step at a time with progress, back/next, and the preference slider as the final step; holds `QuizAnswers` in local state. On submit, compute `quizToEmphasis(answers)` → `recommend(emphasis, { beginnerBias: answers.level === "beginner" })` and show `<QuizResult/>`.

- [ ] **Step 2: `QuizResult.tsx`** — renders the recommended build `SpecPlate`, the `RadarPlot` + `ReadoutBar`s for `recommendation.scores`, a beginner-friendly summary from `describe(config)`, and a primary CTA linking to `/build?c=${encodeConfig(config)}`.

- [ ] **Step 3: `src/app/quiz/page.tsx`** — server shell (title block) rendering `<QuizStepper/>`.

- [ ] **Step 4: Verify** — Run: `npm run dev`; complete the quiz → sensible recommendation; CTA opens `/build` pre-loaded with the recommended config. Confirm keyboard navigation through steps.

- [ ] **Step 5: Commit**

```bash
git add src/components/quiz src/app/quiz
git commit -m "feat(quiz): add fit quiz stepper and recommendation result"
```

> **Skill:** invoke `frontend-design` for the stepper/result visual; `onboard` skill
> guidance for first-time-user clarity if needed.

---

## Task 13: 3D blueprint preview

**Files:**
- Create: `src/components/preview3d/RacquetBlueprint.tsx`, `src/components/preview3d/PreviewCanvas.tsx`, `src/components/preview3d/StaticBlueprint.tsx`

- [ ] **Step 1: `RacquetBlueprint.tsx`** — R3F scene: parametric wireframe racquet (head outline by `shape`, throat open/closed, shaft, handle), a balance-point marker positioned by `balance`, handle radius + color by `grip`, and string-bed line density/brightness by `stringTensionLb` (spec §9). Faint reference grid + dimension ticks. `frameloop="demand"`; cap `dpr`; pause when tab hidden; respect `prefers-reduced-motion` (no auto-rotate).

- [ ] **Step 2: `PreviewCanvas.tsx`** — wraps `<Canvas>`; `next/dynamic` import with `ssr:false`; subscribes to the build store for live config. Provides a WebGL-unavailable fallback to `StaticBlueprint`.

- [ ] **Step 3: `StaticBlueprint.tsx`** — pure SVG silhouette driven by the same params (no WebGL) for the fallback and reduced-motion path.

- [ ] **Step 4: Wire into `Workbench`** (replace the Task 11 placeholder slot).

- [ ] **Step 5: Verify** — Run: `npm run dev`; on `/build`, changing shape/balance/grip/tension visibly changes the 3D blueprint; confirm it lazy-loads (not in the initial JS for `/`). Screenshot via `browse` skill.

- [ ] **Step 6: Commit**

```bash
git add src/components/preview3d
git commit -m "feat(preview): add lazy parametric blueprint 3D racquet"
```

---

## Task 14: Console landing (`/`) + transparency (`/about`)

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/about/page.tsx`
- Modify: `src/app/layout.tsx` (metadata, blueprint frame)

- [ ] **Step 1: `/` console** — replace the scaffold: a "spec plate" hero (terse technical
  copy, no marketing fluff), a brief "how the instrument works" strip, and two primary
  CTAs → `/quiz` and `/build`. Server component. Apply anti-slop checklist (spec §11.3).

- [ ] **Step 2: `/about`** — static transparency page: what the model is/isn't, the five
  axes, and how scores are derived (plain-language summary of spec §6). Server component.

- [ ] **Step 3: `layout.tsx`** — accurate metadata/OG title+description; blueprint frame +
  grid backdrop; nav between console / quiz / build / about.

- [ ] **Step 4: Verify** — Run: `npm run dev`; `/`, `/about` render in the blueprint
  aesthetic, all nav/CTAs work, no console errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/about src/app/layout.tsx
git commit -m "feat(app): add blueprint console landing and transparency page"
```

> **Skill:** invoke `frontend-design` for the landing; then run `critique` + `polish`
> across all routes for a cohesive, non-AI-slop result.

---

## Task 15: Quality pass — a11y, performance, polish

**Files:** cross-cutting (small edits across `src/`).

- [ ] **Step 1: Accessibility** — run the `audit` skill (or `chrome-devtools-mcp:a11y-debugging`); fix contrast, focus-visible, labels, reduced-motion across all routes (spec §12).
- [ ] **Step 2: Performance** — run the `optimize` skill; confirm the 3D bundle is lazy and off the `/` critical path; check Lighthouse mobile ≥ 90 perf / ≥ 95 a11y on `/` and `/build` (spec §13).
- [ ] **Step 3: Lint + typecheck + tests** — Run: `npm run lint && npx tsc --noEmit && npm test` — Expected: all clean/green.
- [ ] **Step 4: Production build** — Run: `npm run build` — Expected: succeeds with no errors.
- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(quality): a11y, performance, and polish pass"
```

---

## Checkpoint B — Pre-deploy verification

`npm run lint && npx tsc --noEmit && npm test && npm run build` all clean. Manually
exercise (or `qa` skill): quiz → recommendation → open in simulator; simulator controls →
scores/explanation/3D update; copy-link → reopen restores the build; malformed `?c=` →
falls back to default without error.

---

## Task 16: Public GitHub repo + push

- [ ] **Step 1: Ensure `main` is clean** — Run: `git status` — Expected: clean tree.
- [ ] **Step 2: Create the public repo and push** —
  Run: `gh repo create racquet-build --public --source=. --remote=origin --push`
  Expected: repo created under `samuelkahessay`, `main` pushed, `origin` set.
- [ ] **Step 3: Verify** — Run: `gh repo view --web` (or `gh repo view`) — Expected: public repo with the pushed history.

---

## Task 17: Deploy to Vercel + verify

- [ ] **Step 1: Deploy production** — use the `vercel:deploy` skill with `prod` (links the
  project on first run; framework auto-detected as Next.js; no env vars needed for v1).
- [ ] **Step 2: Verify the live URL** — load the production URL: console, `/quiz`, `/build`
  render; a shared `?c=` link restores a build; 3D preview works. Use the `browse`/`verify`
  skill against the production URL.
- [ ] **Step 3: Record the URL** — add the production URL to `README.md` and commit; push.

---

## Coverage check (spec → task)

- Domain model (§5) → T2. Scoring engine (§6.1–6.2) → T3. Explanation (§6.3) → T4.
  Recommender (§6.4) → T5. Quiz (§7) → T6 + T12. Simulator (§8) → T9 + T10 + T11.
  3D preview (§9) → T13. Share codec (§10) → T7. Visual language (§11) → T8 + frontend-design
  across T9/T11/T12/T14. A11y (§12) → T15. Perf (§13) → T13 (lazy) + T15. Architecture (§14)
  → file structure above. Testing (§15) → T1–T7, T10 + Checkpoints. Deploy (§16) → T16 + T17.
  Codex review (goal) → Checkpoint A.
```
