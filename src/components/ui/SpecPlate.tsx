"use client";

import { useState } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";
import type { RacquetConfig } from "@/lib/domain/config";
import {
  SHAPE_LABELS,
  WEIGHT_LABELS,
  WEIGHT_RANGE,
  BALANCE_LABELS,
  BALANCE_RANGE,
  GRIP_LABELS,
} from "@/lib/domain/labels";

interface SpecPlateProps {
  config: RacquetConfig;
  shareUrl: string;
  drawingNo: string;
  onReset: () => void;
}

export function SpecPlate({ config, shareUrl, drawingNo, onReset }: SpecPlateProps) {
  const [copied, setCopied] = useState(false);

  const rows: { k: string; v: string; sub?: string }[] = [
    { k: "Shape", v: SHAPE_LABELS[config.shape] },
    { k: "Weight", v: WEIGHT_LABELS[config.weightClass], sub: WEIGHT_RANGE[config.weightClass] },
    { k: "Balance", v: BALANCE_LABELS[config.balance], sub: BALANCE_RANGE[config.balance] },
    { k: "Tension", v: `${config.stringTensionLb} lb` },
    { k: "Grip", v: GRIP_LABELS[config.grip] },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="title-block bg-paper">
      <div className="flex items-center justify-between border-b border-ink px-3 py-2">
        <span className="label text-[11px] text-ink">Build Spec</span>
        <span className="readout text-[10px] text-ink-3">DWG {drawingNo}</span>
      </div>

      <dl className="divide-y divide-rule">
        {rows.map((r) => (
          <div key={r.k} className="flex items-baseline justify-between px-3 py-1.5">
            <dt className="label text-[10px] text-ink-3">{r.k}</dt>
            <dd className="flex items-baseline gap-2 text-right">
              {r.sub && <span className="readout text-[10px] text-ink-3">{r.sub}</span>}
              <span className="font-display text-sm font-semibold text-ink">{r.v}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-ink px-3 py-2">
        <div className="mb-2 flex items-center gap-2">
          <span className="label text-[10px] text-ink-3">Share</span>
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="readout min-w-0 flex-1 truncate bg-paper-2 px-2 py-1 text-[11px] text-ink-2 outline-none"
            aria-label="Shareable build link"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copy}
            className="flex flex-1 items-center justify-center gap-1.5 border border-ink bg-ink px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:bg-accent hover:border-accent"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 border border-rule-major px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.12em] text-ink-2 transition-colors hover:border-ink hover:text-ink"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
