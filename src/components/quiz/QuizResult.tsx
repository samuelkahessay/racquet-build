"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import type { Recommendation } from "@/lib/scoring/recommend";
import { describe } from "@/lib/scoring/explain";
import { encodeConfig } from "@/lib/share/codec";
import { SCORE_AXES } from "@/lib/domain/score";
import {
  AXIS_LABELS,
  SHAPE_LABELS,
  WEIGHT_LABELS,
  BALANCE_LABELS,
  GRIP_LABELS,
} from "@/lib/domain/labels";
import { RadarPlot } from "@/components/ui/RadarPlot";
import { ReadoutBar } from "@/components/ui/ReadoutBar";

export function QuizResult({
  recommendation,
  onRetake,
}: {
  recommendation: Recommendation;
  onRetake: () => void;
}) {
  const { config, scores } = recommendation;
  const summary = describe(config);
  const token = encodeConfig(config);

  const specRows = [
    ["Shape", SHAPE_LABELS[config.shape]],
    ["Weight", WEIGHT_LABELS[config.weightClass]],
    ["Balance", BALANCE_LABELS[config.balance]],
    ["Tension", `${config.stringTensionLb} lb`],
    ["Grip", GRIP_LABELS[config.grip]],
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="border-b border-rule-major pb-3">
        <span className="label text-[11px] text-accent-deep">Recommended starting build</span>
        <h2 className="mt-1 font-display text-2xl font-extrabold uppercase tracking-[0.08em] text-ink">
          Your fit profile
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* spec plate */}
        <div className="title-block bg-paper">
          <div className="flex items-center justify-between border-b border-ink px-3 py-2">
            <span className="label text-[11px] text-ink">Spec</span>
            <span className="readout text-[10px] text-ink-3">DWG {token.replace(/\./g, "").toUpperCase()}</span>
          </div>
          <dl className="divide-y divide-rule">
            {specRows.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between px-3 py-2">
                <dt className="label text-[10px] text-ink-3">{k}</dt>
                <dd className="font-display text-sm font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* profile */}
        <div className="sheet p-4">
          <div className="mx-auto mb-3 aspect-square w-full max-w-[200px]">
            <RadarPlot scores={scores} />
          </div>
          <div className="flex flex-col gap-2">
            {SCORE_AXES.map((axis, i) => (
              <ReadoutBar key={axis} index={i + 1} label={AXIS_LABELS[axis]} value={scores[axis]} />
            ))}
          </div>
        </div>
      </div>

      {summary.length > 0 && (
        <div className="sheet p-4">
          <h3 className="label mb-2 text-xs text-ink-2">Why this build</h3>
          <ul className="flex flex-col gap-1.5">
            {summary.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent">›</span>
                <span className="readout text-[12px] leading-snug text-ink-2">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/build?c=${token}`}
          className="group flex flex-1 items-center justify-center gap-2 border border-ink bg-ink px-4 py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:border-accent hover:bg-accent"
        >
          Open in bench
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
        <button
          type="button"
          onClick={onRetake}
          className="flex items-center justify-center gap-2 border border-rule-major px-4 py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-ink-2 transition-colors hover:border-ink hover:text-ink"
        >
          <RotateCcw size={15} />
          Retake
        </button>
      </div>
    </div>
  );
}
