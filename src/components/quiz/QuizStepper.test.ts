import { describe, expect, it } from "vitest";
import { DEFAULT_ANSWERS, QUESTIONS } from "@/lib/quiz/questions";
import { isQuestionAnswerVisible } from "./QuizStepper";

describe("QuizStepper option state", () => {
  it("does not show the default answer as selected before a question is touched", () => {
    const untouched = new Set<number>();
    const styleQuestion = QUESTIONS.find((question) => question.key === "style");

    expect(styleQuestion).toBeDefined();
    expect(isQuestionAnswerVisible(1, untouched, DEFAULT_ANSWERS, styleQuestion!.key, "allRound")).toBe(
      false,
    );
  });

  it("shows the answer selected by the user for the touched question", () => {
    const touched = new Set([1]);
    const styleQuestion = QUESTIONS.find((question) => question.key === "style");

    expect(styleQuestion).toBeDefined();
    expect(isQuestionAnswerVisible(1, touched, DEFAULT_ANSWERS, styleQuestion!.key, "allRound")).toBe(
      true,
    );
  });
});
