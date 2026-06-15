import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database } from "lucide-react";
import { CATALOG, validateCatalog } from "@/lib/catalog";
import { encodeConfig } from "@/lib/share/codec";
import {
  BALANCE_LABELS,
  SHAPE_LABELS,
  WEIGHT_LABELS,
  AXIS_LABELS,
} from "@/lib/domain/labels";
import { SCORE_AXES } from "@/lib/domain/score";

export const metadata: Metadata = {
  title: "Catalog",
  description:
    "A source-backed seed catalog of real squash racquet specs mapped into the RacquetBuild scoring model.",
};

export default function RacquetsPage() {
  const validationErrors = validateCatalog();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <section className="border-b border-rule-major pb-6">
        <p className="label text-[11px] text-accent-deep">Ref 03 · Real racquet catalog</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold uppercase tracking-[0.04em] text-ink">
              Source-backed frames
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">
              A first database slice: real squash racquet specs preserved with source notes, then
              mapped into the same configuration buckets used by the bench and fit worksheet.
            </p>
          </div>
          <div className="title-block min-w-[220px] bg-paper">
            <div className="flex items-center gap-2 border-b border-ink px-3 py-2">
              <Database size={15} />
              <span className="label text-[11px] text-ink">Catalog status</span>
            </div>
            <dl className="divide-y divide-rule">
              <div className="flex justify-between px-3 py-2">
                <dt className="readout text-[10px] text-ink-3">Frames</dt>
                <dd className="font-display text-sm font-semibold text-ink">{CATALOG.length}</dd>
              </div>
              <div className="flex justify-between px-3 py-2">
                <dt className="readout text-[10px] text-ink-3">Validation</dt>
                <dd className="font-display text-sm font-semibold text-ink">
                  {validationErrors.length === 0 ? "Clean" : `${validationErrors.length} flags`}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {validationErrors.length > 0 && (
        <section className="mt-5 border border-accent bg-accent/5 p-4">
          <h2 className="label text-xs text-accent-deep">Validation flags</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {validationErrors.map((error) => (
              <li key={error} className="readout text-[12px] text-ink-2">
                {error}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {CATALOG.map((racquet) => {
          const token = encodeConfig(racquet.config);
          const primarySource = racquet.sources[0];
          const topAxes = [...SCORE_AXES]
            .sort((a, b) => racquet.scores[b] - racquet.scores[a])
            .slice(0, 2);

          return (
            <article key={racquet.slug} className="sheet flex flex-col p-4">
              <div className="flex items-start justify-between gap-4 border-b border-rule pb-3">
                <div>
                  <p className="readout text-[10px] uppercase tracking-[0.18em] text-accent-deep">
                    {racquet.brand}
                  </p>
                  <h2 className="mt-1 font-display text-xl font-extrabold uppercase tracking-[0.04em] text-ink">
                    {racquet.model}
                  </h2>
                </div>
                <span className="readout border border-rule px-2 py-1 text-[10px] text-ink-3">
                  {racquet.confidence.toUpperCase()}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3">
                <Spec label="Weight" value={`${racquet.advertisedWeightG} g`} />
                <Spec label="Balance" value={racquet.balanceMm ? `${racquet.balanceMm} mm` : "n/a"} />
                <Spec label="Head" value={racquet.headSizeCm2 ? `${racquet.headSizeCm2} cm2` : "n/a"} />
                <Spec label="Pattern" value={racquet.stringPattern ?? "n/a"} />
                <Spec
                  label="Tension"
                  value={
                    racquet.recommendedTensionLb
                      ? `${racquet.recommendedTensionLb[0]}-${racquet.recommendedTensionLb[1]} lb`
                      : "n/a"
                  }
                />
                <Spec label="Length" value={racquet.lengthMm ? `${racquet.lengthMm} mm` : "n/a"} />
              </dl>

              <div className="mt-4 border-t border-rule pt-3">
                <h3 className="label text-[10px] text-ink-3">Mapped build</h3>
                <p className="mt-1 readout text-[12px] leading-relaxed text-ink-2">
                  {SHAPE_LABELS[racquet.config.shape]} · {WEIGHT_LABELS[racquet.config.weightClass]} ·{" "}
                  {BALANCE_LABELS[racquet.config.balance]} · {racquet.config.stringTensionLb} lb
                </p>
                <p className="mt-1 readout text-[12px] text-ink-3">
                  Strongest axes: {topAxes.map((axis) => AXIS_LABELS[axis]).join(" / ")}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-rule pt-3 sm:flex-row">
                <Link
                  href={`/build?c=${token}`}
                  className="group flex flex-1 items-center justify-center gap-2 border border-ink bg-ink px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:border-accent hover:bg-accent"
                >
                  Open in bench
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href={primarySource.url}
                  className="flex flex-1 items-center justify-center border border-rule-major px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.12em] text-ink-2 transition-colors hover:border-ink hover:text-ink"
                  rel="noreferrer"
                  target="_blank"
                >
                  Source
                </a>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label text-[10px] text-ink-3">{label}</dt>
      <dd className="mt-0.5 readout text-[12px] text-ink">{value}</dd>
    </div>
  );
}
