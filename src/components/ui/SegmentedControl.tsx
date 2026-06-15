"use client";

import { useId, useRef } from "react";
import clsx from "clsx";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  code?: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  name: string;
}

export function SegmentedControl<T extends string>({
  label,
  code,
  value,
  options,
  onChange,
  name,
}: SegmentedControlProps<T>) {
  const groupId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (delta: number) => {
    const i = options.findIndex((o) => o.value === value);
    const next = (i + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-labelledby={groupId} className="select-none">
      <div className="mb-2 flex items-baseline justify-between">
        <span id={groupId} className="label text-[11px]">
          {label}
        </span>
        {code && <span className="readout text-[10px] text-ink-3">{code}</span>}
      </div>

      <div className="grid auto-cols-fr grid-flow-col border border-rule-major">
        {options.map((opt, i) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              name={name}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  move(1);
                } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  move(-1);
                }
              }}
              className={clsx(
                "group relative flex flex-col items-start gap-0.5 px-3 py-2.5 text-left transition-colors",
                "not-last:border-r border-rule-major",
                active ? "bg-paper" : "bg-paper-2/60 hover:bg-paper-2",
              )}
            >
              {/* active terminal tick */}
              <span
                aria-hidden
                className={clsx(
                  "absolute inset-x-0 top-0 h-[2px] transition-colors",
                  active ? "bg-accent" : "bg-transparent",
                )}
              />
              <span
                className={clsx(
                  "font-display text-sm font-semibold leading-tight transition-colors",
                  active ? "text-ink" : "text-ink-3 group-hover:text-ink-2",
                )}
              >
                {opt.label}
              </span>
              {opt.hint && (
                <span className="readout text-[10px] leading-tight text-ink-3">{opt.hint}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
