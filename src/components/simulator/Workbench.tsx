"use client";

import { useEffect, useRef, useState } from "react";
import { useBuildStore } from "@/lib/state/store";
import { score } from "@/lib/scoring/score";
import { explain } from "@/lib/scoring/explain";
import { encodeConfig } from "@/lib/share/codec";
import { SCORE_AXES } from "@/lib/domain/score";
import {
  SHAPES,
  WEIGHT_CLASSES,
  BALANCES,
  GRIPS,
  TENSION_MIN,
  TENSION_MAX,
} from "@/lib/domain/config";
import {
  SHAPE_LABELS,
  SHAPE_HINTS,
  WEIGHT_LABELS,
  WEIGHT_RANGE,
  BALANCE_LABELS,
  BALANCE_RANGE,
  GRIP_LABELS,
  GRIP_HINTS,
  AXIS_LABELS,
} from "@/lib/domain/labels";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { TensionSlider } from "@/components/ui/TensionSlider";
import { ReadoutBar } from "@/components/ui/ReadoutBar";
import { RadarPlot } from "@/components/ui/RadarPlot";
import { SpecPlate } from "@/components/ui/SpecPlate";
import { RacquetDrawing } from "@/components/preview/RacquetDrawing";

const shapeOptions = SHAPES.map((s) => ({ value: s, label: SHAPE_LABELS[s], hint: SHAPE_HINTS[s] }));
const weightOptions = WEIGHT_CLASSES.map((w) => ({
  value: w,
  label: WEIGHT_LABELS[w],
  hint: WEIGHT_RANGE[w],
}));
const balanceOptions = BALANCES.map((b) => ({
  value: b,
  label: BALANCE_LABELS[b],
  hint: BALANCE_RANGE[b],
}));
const gripOptions = GRIPS.map((g) => ({ value: g, label: GRIP_LABELS[g], hint: GRIP_HINTS[g] }));

export function Workbench({ initialToken }: { initialToken: string | null }) {
  const config = useBuildStore((s) => s.config);
  const prev = useBuildStore((s) => s.prev);
  const setField = useBuildStore((s) => s.setField);
  const reset = useBuildStore((s) => s.reset);
  const hydrate = useBuildStore((s) => s.hydrateFromToken);

  const [origin, setOrigin] = useState("");
  const hydrated = useRef(false);

  // hydrate once from the incoming ?c= link, then capture origin for share URLs.
  // setOrigin runs in a rAF callback (not synchronously) so SSR/hydration markup
  // matches and React isn't asked to setState within the effect body.
  useEffect(() => {
    if (!hydrated.current) {
      hydrate(initialToken);
      hydrated.current = true;
    }
    const id = requestAnimationFrame(() => setOrigin(window.location.origin));
    return () => cancelAnimationFrame(id);
  }, [initialToken, hydrate]);

  const token = encodeConfig(config);

  // keep the URL in sync (debounced, shallow — no navigation / scroll)
  useEffect(() => {
    if (!hydrated.current) return;
    const id = setTimeout(() => {
      window.history.replaceState(null, "", `/build?c=${token}`);
    }, 150);
    return () => clearTimeout(id);
  }, [token]);

  const scores = score(config);
  const explanation = explain(prev, config);
  const shareUrl = origin ? `${origin}/build?c=${token}` : `/build?c=${token}`;
  const drawingNo = token.replace(/\./g, "").toUpperCase();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-rule-major pb-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-[0.1em] text-ink">
            Configuration Bench
          </h1>
          <p className="mt-1 max-w-prose text-sm text-ink-2">
            Adjust the five build variables. Scores and the drawing update live. Every state is in
            the link — copy it to share a build.
          </p>
        </div>
        <span className="readout text-[11px] text-ink-3">DWG&nbsp;{drawingNo}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* controls */}
        <section className="sheet order-2 flex flex-col gap-5 p-4 lg:order-1 lg:col-span-5">
          <h2 className="label text-xs text-ink-2">Inputs</h2>
          <SegmentedControl
            name="shape"
            code="A1"
            label="Head shape"
            value={config.shape}
            options={shapeOptions}
            onChange={(v) => setField("shape", v)}
          />
          <SegmentedControl
            name="weight"
            code="A2"
            label="Weight class"
            value={config.weightClass}
            options={weightOptions}
            onChange={(v) => setField("weightClass", v)}
          />
          <SegmentedControl
            name="balance"
            code="A3"
            label="Balance"
            value={config.balance}
            options={balanceOptions}
            onChange={(v) => setField("balance", v)}
          />
          <TensionSlider
            code="A4"
            label="String tension"
            value={config.stringTensionLb}
            min={TENSION_MIN}
            max={TENSION_MAX}
            lowMax={23}
            highMin={29}
            onChange={(v) => setField("stringTensionLb", v)}
          />
          <SegmentedControl
            name="grip"
            code="A5"
            label="Grip setup"
            value={config.grip}
            options={gripOptions}
            onChange={(v) => setField("grip", v)}
          />
        </section>

        {/* drawing */}
        <section className="order-1 lg:order-2 lg:col-span-3">
          <div className="blueprint-panel relative mx-auto aspect-[5/9] w-full max-w-[240px] overflow-hidden">
            <div className="absolute inset-0 p-2">
              <RacquetDrawing config={config} />
            </div>
            {/* drawing HUD */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="readout text-[10px] uppercase tracking-[0.16em] text-blueprint-ink/80">
                  {SHAPE_LABELS[config.shape]}
                </span>
                <span className="readout text-[10px] text-blueprint-ink/80">plan</span>
              </div>
              <div className="flex items-end justify-between gap-2">
                <span className="readout text-[10px] text-blueprint-ink/80">
                  {config.stringTensionLb} lb
                </span>
                <span className="readout text-[10px] text-blueprint-ink/80">
                  {BALANCE_LABELS[config.balance]}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-2 readout text-center text-[10px] text-ink-3">
            2D drawing · reacts to shape, weight, balance, grip and tension.
          </p>
        </section>

        {/* outputs */}
        <section className="order-3 flex flex-col gap-4 lg:col-span-4 lg:order-3">
          <div className="sheet p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="label text-xs text-ink-2">Performance profile</h2>
              <span className="readout text-[10px] text-ink-3">0–100</span>
            </div>
            <div className="mx-auto mb-4 aspect-square w-full max-w-[230px]">
              <RadarPlot scores={scores} />
            </div>
            <div className="flex flex-col gap-2.5">
              {SCORE_AXES.map((axis, i) => (
                <ReadoutBar key={axis} index={i + 1} label={AXIS_LABELS[axis]} value={scores[axis]} />
              ))}
            </div>
          </div>

          <div className="sheet p-4">
            <h2 className="label mb-2 text-xs text-ink-2">What changed · why</h2>
            {explanation.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {explanation.map((line, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink">
                    <span className="text-accent">›</span>
                    <span className="readout text-[12px] leading-snug text-ink-2">{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="readout text-[12px] text-ink-3">
                Neutral reference build — every axis at 50. Move a control to see the trade-offs.
              </p>
            )}
          </div>

          <SpecPlate config={config} shareUrl={shareUrl} drawingNo={drawingNo} onReset={reset} />
        </section>
      </div>
    </div>
  );
}
