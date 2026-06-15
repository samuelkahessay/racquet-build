import type { Metadata } from "next";
import { QuizStepper } from "@/components/quiz/QuizStepper";

export const metadata: Metadata = {
  title: "Fit",
  description:
    "Answer five quick questions and get a recommended squash racquet build with plain-language reasoning.",
};

export default function QuizPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <QuizStepper />
    </div>
  );
}
