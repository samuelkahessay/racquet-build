import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  SHAPE_DELTA,
  WEIGHT_DELTA,
  BALANCE_DELTA,
  GRIP_DELTA,
  TENSION_COEFF,
} from "@/lib/scoring/model";
import { SCORE_AXES, type ScoreVector } from "@/lib/domain/score";
import {
  AXIS_SHORT,
  SHAPE_LABELS,
  WEIGHT_LABELS,
  BALANCE_LABELS,
  GRIP_LABELS,
} from "@/lib/domain/labels";

export const metadata: Metadata = {
  title: "Spec",
  description:
    "How the RacquetBuild model works: a transparent heuristic that maps a configuration to five performance scores.",
};

function Glyph({ value }: { value: number }) {
  const mag = Math.abs(value);
  if (mag < 2) return <span className="text-ink-3">·</span>;
  const strong = mag >= 10;
  const up = value > 0;
  return (
    <span className={up ? "text-accent-deep" : "text-ink"} title={`${value > 0 ? "+" : ""}${value}`}>
      {up ? (strong ? "▲▲" : "▲") : strong ? "▼▼" : "▼"}
    </span>
  );
}

function Matrix({
  caption,
  rows,
}: {
  caption: string;
  rows: { label: string; deltas: ScoreVector }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <caption className="label mb-2 text-left text-[11px] text-ink-2">{caption}</caption>
        <thead>
          <tr className="border-b border-rule-major">
            <th className="py-1.5 pr-3 font-display text-xs font-semibold text-ink-3" />
            {SCORE_AXES.map((axis) => (
              <th
                key={axis}
                className="px-2 py-1.5 text-center readout text-[10px] font-normal text-ink-3"
              >
                {AXIS_SHORT[axis]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-rule">
              <td className="py-1.5 pr-3 font-display text-sm font-semibold text-ink">{r.label}</td>
              {SCORE_AXES.map((axis) => (
                <td key={axis} className="px-2 py-1.5 text-center text-sm">
                  <Glyph value={r.deltas[axis]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AboutPage() {
  const tensionRow: ScoreVector = {
    power: TENSION_COEFF.power,
    control: TENSION_COEFF.control,
    maneuverability: TENSION_COEFF.maneuverability,
    forgiveness: TENSION_COEFF.forgiveness,
    comfort: TENSION_COEFF.comfort,
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="label text-[11px] text-accent-deep">Specification · Model</p>
      <h1 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-[0.04em] text-ink">
        How the model works
      </h1>

      <div className="mt-6 flex flex-col gap-4 text-base leading-relaxed text-ink-2">
        <p>
          RacquetBuild is a <strong className="text-ink">transparent heuristic</strong>, not a
          lab measurement of any racquet. It exists to make the trade-offs between common
          configuration choices legible to beginner and intermediate players, then maps real
          catalog frames into those same buckets when source-backed specs are available.
        </p>
        <p>
          Every axis starts at a <strong className="text-ink">baseline of 50</strong> — the neutral
          reference build (hybrid head, medium weight, even balance, 26&nbsp;lb, stock grip). Each
          variable adds or subtracts a fixed amount per axis; string tension contributes a linear
          amount around the 26&nbsp;lb pivot. The totals are clamped to 0–100.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-7">
        <Matrix
          caption="Head shape → score influence"
          rows={(Object.keys(SHAPE_DELTA) as (keyof typeof SHAPE_DELTA)[]).map((k) => ({
            label: SHAPE_LABELS[k],
            deltas: SHAPE_DELTA[k],
          }))}
        />
        <Matrix
          caption="Weight class → score influence"
          rows={(Object.keys(WEIGHT_DELTA) as (keyof typeof WEIGHT_DELTA)[]).map((k) => ({
            label: WEIGHT_LABELS[k],
            deltas: WEIGHT_DELTA[k],
          }))}
        />
        <Matrix
          caption="Balance → score influence"
          rows={(Object.keys(BALANCE_DELTA) as (keyof typeof BALANCE_DELTA)[]).map((k) => ({
            label: BALANCE_LABELS[k],
            deltas: BALANCE_DELTA[k],
          }))}
        />
        <Matrix
          caption="Grip → score influence"
          rows={(Object.keys(GRIP_DELTA) as (keyof typeof GRIP_DELTA)[]).map((k) => ({
            label: GRIP_LABELS[k],
            deltas: GRIP_DELTA[k],
          }))}
        />
        <Matrix caption="String tension → influence per pound above 26 lb" rows={[{ label: "+1 lb", deltas: tensionRow }]} />
      </div>

      <div className="mt-8 border-t border-rule-major pt-6">
        <h2 className="label text-xs text-ink-2">The fit worksheet</h2>
        <p className="mt-2 text-base leading-relaxed text-ink-2">
          The worksheet turns your answers into a weighting of the five axes, then searches the full
          grid of builds for the one whose scores best match what you said you value. Beginners get a
          tie-break toward forgiveness and comfort.
        </p>
      </div>

      <div className="mt-8 border border-rule-major bg-paper-2 p-4">
        <p className="readout text-[12px] leading-relaxed text-ink-2">
          This is a learning tool. Score weights are hand-set for legibility, not fitted to lab
          data. Catalog entries cite source pages and preserve confidence notes, but scores remain
          directional intuition rather than purchase instructions.
        </p>
      </div>

      <Link
        href="/build"
        className="group mt-8 inline-flex items-center gap-2 border border-ink bg-ink px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:border-accent hover:bg-accent"
      >
        Open the bench
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
