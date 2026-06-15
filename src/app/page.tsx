import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StaticBlueprint } from "@/components/preview3d/StaticBlueprint";
import { DEFAULT_CONFIG } from "@/lib/domain/config";
import { AXIS_LABELS } from "@/lib/domain/labels";
import { SCORE_AXES } from "@/lib/domain/score";

const PROCESS = [
  { n: "01", k: "Inputs", v: "Five variables: head shape, weight, balance, string tension, grip." },
  { n: "02", k: "Model", v: "A transparent heuristic. 50 is the neutral baseline; every choice shifts it." },
  { n: "03", k: "Output", v: "Five scores and the trade-off, drawn live as you tune." },
];

const VARIABLES = [
  ["Shape", "Teardrop · Traditional · Hybrid"],
  ["Weight", "Light · Medium · Heavy"],
  ["Balance", "Head-light · Even · Head-heavy"],
  ["Tension", "18 – 32 lb"],
  ["Grip", "Stock · Thin · Thick · Tacky"],
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      {/* hero */}
      <section className="grid grid-cols-1 items-center gap-8 border-b border-rule-major py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
        <div>
          <p className="label text-[11px] text-accent-deep">Ref 00 · Squash configuration</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] text-ink sm:text-5xl">
            Read the racquet
            <br />
            before you buy it.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-2">
            RacquetBuild is an engineering bench for squash players. Tune a build and watch the
            trade-offs in power, control, maneuverability, forgiveness and comfort — no jargon, no
            marketing, just a transparent model on a drafting table.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/build"
              className="group flex items-center justify-center gap-2 border border-ink bg-ink px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:border-accent hover:bg-accent"
            >
              Open the bench
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/quiz"
              className="flex items-center justify-center gap-2 border border-rule-major px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-ink-2 transition-colors hover:border-ink hover:text-ink"
            >
              Take the fit worksheet
            </Link>
            <Link
              href="/racquets"
              className="flex items-center justify-center gap-2 border border-rule-major px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-ink-2 transition-colors hover:border-ink hover:text-ink"
            >
              Browse real frames
            </Link>
          </div>
        </div>

        {/* hero drawing */}
        <div className="blueprint-panel relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden">
          <StaticBlueprint config={DEFAULT_CONFIG} />
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
            <div className="flex justify-between">
              <span className="readout text-[10px] uppercase tracking-[0.18em] text-blueprint-ink/80">
                Hybrid · plan view
              </span>
              <span className="readout text-[10px] text-blueprint-ink/80">scale 1:1</span>
            </div>
            <span className="readout text-[10px] text-blueprint-ink/80">
              26 lb · neutral reference build
            </span>
          </div>
        </div>
      </section>

      {/* process ledger */}
      <section className="grid grid-cols-1 divide-y divide-rule-major border-b border-rule-major sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {PROCESS.map((p) => (
          <div key={p.n} className="px-1 py-6 sm:px-5">
            <span className="readout text-xs text-accent-deep">{p.n}</span>
            <h2 className="mt-2 font-display text-lg font-bold uppercase tracking-[0.08em] text-ink">
              {p.k}
            </h2>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-ink-2">{p.v}</p>
          </div>
        ))}
      </section>

      {/* variables + axes */}
      <section className="grid grid-cols-1 gap-8 py-10 md:grid-cols-2">
        <div>
          <h2 className="label text-xs text-ink-2">Build variables</h2>
          <dl className="mt-3 border-t border-rule-major">
            {VARIABLES.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between border-b border-rule py-2.5">
                <dt className="font-display text-sm font-semibold text-ink">{k}</dt>
                <dd className="readout text-[12px] text-ink-3">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="label text-xs text-ink-2">Output axes</h2>
          <ul className="mt-3 border-t border-rule-major">
            {SCORE_AXES.map((axis, i) => (
              <li key={axis} className="flex items-center gap-3 border-b border-rule py-2.5">
                <span className="readout text-[11px] text-accent-deep">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-sm font-semibold text-ink">
                  {AXIS_LABELS[axis]}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-2">
            Scores are a heuristic. Real racquet specs are source-cited where available.{" "}
            <Link
              href="/racquets"
              className="text-accent-deep underline underline-offset-2 hover:text-accent"
            >
              Browse the catalog.
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
