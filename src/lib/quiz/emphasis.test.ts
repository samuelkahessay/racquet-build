import { describe, it, expect } from "vitest";
import { quizToEmphasis } from "./emphasis";
import type { QuizAnswers } from "./questions";

const answers = (p: Partial<QuizAnswers> = {}): QuizAnswers => ({
  level: "beginner",
  style: "allRound",
  swing: "moderate",
  pain: "mishits",
  preference: 0,
  ...p,
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
