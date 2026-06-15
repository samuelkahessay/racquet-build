"use client";

import { useCountUp } from "./useCountUp";

interface ReadoutBarProps {
  label: string;
  value: number; // 0..100
  index?: number; // for the gauge number prefix
}

const SEGMENTS = 20;

export function ReadoutBar({ label, value, index }: ReadoutBarProps) {
  const shown = useCountUp(value);
  const filled = Math.round((shown / 100) * SEGMENTS);

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
      <div className="flex items-center gap-2">
        {index !== undefined && (
          <span className="readout text-[10px] text-ink-3">
            {String(index).padStart(2, "0")}
          </span>
        )}
        <span className="label text-[11px] text-ink-2">{label}</span>
      </div>
      <span className="readout text-sm tabular-nums text-ink">
        {String(shown).padStart(2, "0")}
        <span className="text-ink-3">/100</span>
      </span>

      {/* segmented gauge */}
      <div className="col-span-2 flex h-3 gap-[2px]" aria-hidden>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <span
            key={i}
            className="flex-1 transition-colors duration-150"
            style={{
              background:
                i < filled
                  ? i >= SEGMENTS - 4
                    ? "var(--accent)"
                    : "var(--ink)"
                  : "var(--paper-3)",
              outline: "1px solid var(--rule)",
              outlineOffset: "-1px",
            }}
          />
        ))}
      </div>
    </div>
  );
}
