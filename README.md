# RacquetBuild

**Live:** https://racquet-build.vercel.app

An engineering bench for squash racquets. Tune a build — head shape, weight, balance,
string tension and grip — and read the trade-offs in **power, control, maneuverability,
forgiveness and comfort**, drawn live on a blueprint. No jargon, no marketing: a
transparent heuristic on a drafting table.

> RacquetBuild is a learning tool. Scores come from a hand-set heuristic model; the
> catalog preserves source-backed manufacturer/retailer specs and maps them into that
> model for comparison.

## Surfaces

- **`/build` — Configuration bench.** Adjust five variables and watch the five scores, the
  trade-off explanation, and a parametric blueprint drawing update in real time. Every
  build is encoded in the URL (`?c=…`) so any setup is shareable.
- **`/quiz` — Fit worksheet.** Five quick questions produce a recommended starting build
  with plain-language reasoning and closest real-frame matches, then drop you into the
  bench pre-loaded.
- **`/racquets` — Source-backed catalog.** Real squash racquet specs are stored with
  provenance, validated, and mapped into the simulator's config buckets.
- **`/about` — Model spec.** The exact influence of each variable, rendered straight from
  the scoring coefficient tables.

## How it works

A single pure, deterministic **scoring engine** maps a configuration to a five-axis score
vector (baseline 50, additive per-variable deltas, linear tension term, clamped 0–100).
Both consumers reuse it:

- The **bench** runs it forward (config → scores).
- The **worksheet** runs it inverse: it turns your answers into an emphasis weighting and
  searches the full grid of builds for the closest match.

The engine, recommender, catalog mapping, quiz mapping and share codec live in
[`src/lib`](src/lib) — pure, framework-agnostic, and fully unit-tested.

## Racquet drawing fidelity

The live blueprint in [`src/components/preview`](src/components/preview) uses a pure SVG
geometry model calibrated against squash-specific references: World Squash dimensional
limits, teardrop/open-throat long-main string beds, and traditional bridged heads with
shorter mains. The head outline is sampled from cubic curves so the upper head stays
broad and rounded before tapering smoothly into the throat.

## Tech

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 — a custom "drafting table" design system
- Zustand for bench state · URL-encoded shareable builds
- A pure-SVG parametric squash-racquet blueprint that reacts live to the config
- Vitest for the engine, recommender and codec tests

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests
npm run build    # production build
```

## Documentation

- [Product plan](docs/product-plan.md)
- [Engineering spec sheet](docs/spec.md)
- [Implementation plan](docs/superpowers/plans/2026-06-15-racquetbuild-mvp.md)
