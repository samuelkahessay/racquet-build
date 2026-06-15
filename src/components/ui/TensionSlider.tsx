"use client";

import { useId, type CSSProperties } from "react";

interface TensionSliderProps {
  label: string;
  code?: string;
  value: number;
  min: number;
  max: number;
  lowMax: number; // upper bound of the "low" zone
  highMin: number; // lower bound of the "high" zone
  onChange: (value: number) => void;
}

export function TensionSlider({
  label,
  code,
  value,
  min,
  max,
  lowMax,
  highMin,
  onChange,
}: TensionSliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  const zone = value <= lowMax ? "Low" : value >= highMin ? "High" : "Medium";
  const tickPct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <div className="select-none">
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="label text-[11px]">
          {label}
        </label>
        <span className="readout text-[10px] text-ink-3">{code}</span>
      </div>

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              id={id}
              type="range"
              className="draft-range"
              min={min}
              max={max}
              step={1}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              aria-valuetext={`${value} pounds, ${zone} tension`}
              style={{ "--pct": `${pct}%` } as CSSProperties}
            />
            {/* boundary ticks */}
            {[lowMax + 0.5, highMin - 0.5].map((v) => (
              <span
                key={v}
                aria-hidden
                className="pointer-events-none absolute top-[3px] h-[12px] w-px bg-ink-3/60"
                style={{ left: `${tickPct(v)}%` }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between readout text-[10px] text-ink-3">
            <span>{min} lb</span>
            <span>Low · Med · High</span>
            <span>{max} lb</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="readout text-2xl font-medium leading-none text-ink">
            {value}
            <span className="ml-1 text-sm text-ink-3">lb</span>
          </div>
          <div className="label mt-1 text-[10px] text-accent-deep">{zone}</div>
        </div>
      </div>
    </div>
  );
}
