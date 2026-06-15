"use client";

import { useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import clsx from "clsx";
import {
  QUESTIONS,
  DEFAULT_ANSWERS,
  type QuizAnswers,
} from "@/lib/quiz/questions";
import { quizToEmphasis } from "@/lib/quiz/emphasis";
import { recommend, type Recommendation } from "@/lib/scoring/recommend";
import { recommendCatalog, type CatalogRecommendation } from "@/lib/catalog";
import { QuizResult } from "./QuizResult";

const TOTAL = QUESTIONS.length + 1; // questions + preference slider

export function QuizStepper() {
  const [answers, setAnswers] = useState<QuizAnswers>(DEFAULT_ANSWERS);
  const [touched, setTouched] = useState<Set<number>>(new Set());
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Recommendation | null>(null);
  const [catalogMatches, setCatalogMatches] = useState<CatalogRecommendation[]>([]);

  const isPreferenceStep = step === QUESTIONS.length;

  const compute = () => {
    const emphasis = quizToEmphasis(answers);
    const beginnerBias = answers.level === "beginner";
    setResult(recommend(emphasis, { beginnerBias }));
    setCatalogMatches(recommendCatalog(emphasis, { beginnerBias, limit: 3 }));
  };

  if (result) {
    return (
      <QuizResult
        recommendation={result}
        catalogMatches={catalogMatches}
        onRetake={() => {
          setResult(null);
          setCatalogMatches([]);
          setStep(0);
          setTouched(new Set());
          setAnswers(DEFAULT_ANSWERS);
        }}
      />
    );
  }

  const progress = ((step + 1) / TOTAL) * 100;

  return (
    <div className="flex flex-col gap-5">
      {/* progress header */}
      <div className="border-b border-rule-major pb-3">
        <div className="flex items-center justify-between">
          <span className="label text-[11px] text-accent-deep">Fit worksheet</span>
          <span className="readout text-[11px] text-ink-3">
            Q{String(step + 1).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
          </span>
        </div>
        <div className="mt-2 h-1 w-full bg-paper-3">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {!isPreferenceStep ? (
        <QuestionStep
          key={QUESTIONS[step].key}
          index={step}
          answers={answers}
          onPick={(key, value) => {
            setAnswers((a) => ({ ...a, [key]: value }));
            setTouched((t) => new Set(t).add(step));
            // advance after a short beat for tactile feedback
            setTimeout(() => setStep((s) => Math.min(s + 1, TOTAL - 1)), 160);
          }}
        />
      ) : (
        <PreferenceStep
          value={answers.preference}
          onChange={(v) => {
            setAnswers((a) => ({ ...a, preference: v }));
            setTouched((t) => new Set(t).add(step));
          }}
        />
      )}

      {/* nav */}
      <div className="flex items-center justify-between border-t border-rule-major pt-4">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex min-h-11 items-center gap-1.5 px-2 py-2 font-display text-xs font-semibold uppercase tracking-[0.12em] text-ink-2 transition-colors enabled:hover:text-ink disabled:opacity-30"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {isPreferenceStep ? (
          <button
            type="button"
            onClick={compute}
            className="group flex min-h-11 items-center gap-2 border border-ink bg-ink px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:border-accent hover:bg-accent"
          >
            Compute build
            <Check size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(s + 1, TOTAL - 1))}
            className="group flex min-h-11 items-center gap-1.5 px-2 py-2 font-display text-xs font-semibold uppercase tracking-[0.12em] text-ink-2 transition-colors hover:text-ink"
          >
            {touched.has(step) ? "Next" : "Skip"}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function QuestionStep({
  index,
  answers,
  onPick,
}: {
  index: number;
  answers: QuizAnswers;
  onPick: <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => void;
}) {
  const q = QUESTIONS[index];
  const current = answers[q.key];

  return (
    <fieldset>
      <legend className="font-display text-xl font-bold leading-snug text-ink">{q.prompt}</legend>
      <div className="mt-4 flex flex-col gap-2">
        {q.options.map((opt, i) => {
          const active = opt.value === current;
          return (
            <button
              key={String(opt.value)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onPick(q.key, opt.value as QuizAnswers[typeof q.key])}
              className={clsx(
                "group flex items-center gap-3 border px-3 py-3 text-left transition-colors",
                active
                  ? "border-accent bg-accent/5"
                  : "border-rule-major bg-paper hover:border-ink-3 hover:bg-paper-2",
              )}
            >
              <span
                className={clsx(
                  "readout text-[10px] transition-colors",
                  active ? "text-accent" : "text-ink-3",
                )}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">
                <span className="block font-display text-sm font-semibold text-ink">{opt.label}</span>
                <span className="readout block text-[11px] text-ink-3">{opt.hint}</span>
              </span>
              <span
                className={clsx(
                  "flex size-4 items-center justify-center border transition-colors",
                  active ? "border-accent bg-accent text-paper" : "border-rule-major",
                )}
              >
                {active && <Check size={11} />}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function PreferenceStep({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pct = value * 100;
  return (
    <div>
      <h2 className="font-display text-xl font-bold leading-snug text-ink">
        Learning-friendly, or performance-focused?
      </h2>
      <p className="mt-1 text-sm text-ink-2">
        Bias the recommendation toward forgiveness and comfort, or toward power and control.
      </p>
      <div className="mt-6">
        <input
          type="range"
          className="draft-range"
          min={0}
          max={100}
          step={5}
          value={pct}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          aria-label="Preference: learning-friendly to performance-focused"
          aria-valuetext={`${Math.round(pct)} percent toward performance`}
          style={{ "--pct": `${pct}%` } as CSSProperties}
        />
        <div className="mt-2 flex justify-between">
          <span className="label text-[10px] text-ink-2">Learning-friendly</span>
          <span className="readout text-[11px] text-ink-3">{Math.round(pct)}%</span>
          <span className="label text-[10px] text-ink-2">Performance</span>
        </div>
      </div>
    </div>
  );
}
