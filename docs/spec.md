# RacquetBuild — Engineering Spec Sheet

> Status: v1 (MVP). Source: [`docs/product-plan.md`](./product-plan.md).
> This document is the contract. Code derives from it; when reality forces a change, the spec changes first.

---

## 1. Summary

RacquetBuild is a mobile-first web app that helps beginner and intermediate squash
players understand racquet attributes, get a recommended starting setup, and tune an
existing setup with clear trade-offs. It is a **single-page configuration console** with
a guided **fit quiz**, a live **configuration simulator**, a stylized **3D blueprint
preview**, and **shareable URL-encoded builds**.

The product's technical core is one **pure, deterministic scoring engine** that maps a
racquet configuration to a five-axis performance vector. Both the simulator (forward:
config → scores) and the quiz (inverse: desired emphasis → best-matching config) are
thin consumers of this engine.

### Design north star

An **engineering instrument**, not a marketing page. Think technical drawing / CAD
readout / factory configurator: a measured grid, hairline rules, dimension lines,
monospace instrument readouts, and a wireframe racquet "blueprint." This deliberately
avoids generic AI-generated aesthetics (purple gradients, soft rounded cards, emoji,
hero blur). See §11.

---

## 2. Goals & Non-Goals

### MVP goals
- G1 — A player can adjust a racquet configuration and immediately see five scores
  (Power, Control, Maneuverability, Forgiveness, Comfort) plus a plain-language
  explanation of what changed and why.
- G2 — A player can take a short fit quiz and receive a recommended build with
  beginner-friendly reasoning, then drop straight into the simulator pre-loaded with it.
- G3 — A stylized 3D blueprint racquet reflects visible config changes (shape, balance
  emphasis, grip thickness/color, string-bed tension).
- G4 — Any build is encodable to a short shareable URL and restorable from it.
- G5 — The scoring model is transparent, deterministic, fully unit-tested, and tunable
  from a single data table.
- G6 — Mobile-first, fast (see §13 budgets), accessible (§12), deployed on Vercel.

### Non-goals (explicitly out for v1)
- N1 — Real brand/model racquet database (generic profiles only — phase 2).
- N2 — User accounts, auth, server-side persistence (share state is URL-encoded).
- N3 — Community features: reviews, submitted setups, coach notes (phase 2).
- N4 — Photorealistic 3D, physics simulation, or ball-flight modeling.
- N5 — Any backend database or API beyond Next.js route handlers (none needed for v1).
- N6 — Claims of expert/authoritative truth. The model is an explicit, labeled heuristic.

---

## 3. Personas & Primary Flows

**P1 — First-racquet buyer (beginner/intermediate).** Doesn't know what the numbers mean.
Enters via the **Quiz**, gets a recommended build + explanation, explores variations.

**P2 — Tuner (owns a racquet).** Wants to change strings/grip/balance feel. Enters the
**Simulator** directly, nudges variables, reads the trade-off explanations.

**P3 — Sharer.** Found a build they like, copies the share link, sends it.

### Flows
- F1 Quiz → Result → "Open in simulator" (config pre-loaded).
- F2 Direct simulator → adjust controls → read scores + explanation → 3D updates live.
- F3 Simulator → "Copy build link" → URL carries full config → recipient lands on F2 with that config.

---

## 4. Information Architecture & Routes

Single Next.js App Router application. Server Components for static shell; client
"islands" for the interactive simulator, quiz, and 3D canvas.

| Route | Type | Purpose |
|---|---|---|
| `/` | Server (static) shell | Landing/console: hero "spec plate", what the tool does, primary CTAs into the quiz and the simulator. No interactive config state here. |
| `/quiz` | Client island in server shell | Multi-step fit quiz; on submit, routes to `/build?c=<encoded>`. |
| `/build` | Client island in server shell | The canonical simulator "workbench": controls + readouts + 3D preview. Reads `?c=` (config) on load; writes `?c=` on change (shallow). This is the only place config state lives. |
| `/about` | Server (static) | What the model is and isn't; how scores are derived (transparency page). |

> Routing note: this targets **Next.js 16** (App Router). Confirm current conventions in
> `node_modules/next/dist/docs/` before writing route/searchParams code — Next 16 has
> breaking changes vs. older training data (see `AGENTS.md`). In particular verify the
> `searchParams`/`params` async access pattern and `next/navigation` client hooks.

---

## 5. Domain Model

All config types live in `src/lib/domain/` and are the single source of truth for the
engine, UI, and codecs.

### 5.1 Configuration variables

```ts
type Shape = "teardrop" | "traditional" | "hybrid";
type WeightClass = "light" | "medium" | "heavy";   // see ranges below
type Balance = "headLight" | "even" | "headHeavy";
type GripSetup = "stock" | "thinOver" | "thickOver" | "tacky";

interface RacquetConfig {
  shape: Shape;
  weightClass: WeightClass;
  balance: Balance;
  stringTensionLb: number;  // continuous, integer lb, clamped to TENSION range
  grip: GripSetup;
}
```

### 5.2 Reference ranges & display metadata (data, not prose)

These are display hints surfaced in the UI; they are realistic for squash, not tennis.

| Variable | Options / range | Display detail |
|---|---|---|
| Shape | teardrop / traditional / hybrid | teardrop = open throat, larger sweet spot; traditional = closed throat bridge, more feel; hybrid = blend |
| Weight class | light / medium / heavy | light ≈ 105–120 g, medium ≈ 120–140 g, heavy ≈ 140–170 g (strung) |
| Balance | headLight / even / headHeavy | balance point ≈ <360 mm / 360–370 mm / >370 mm on a 360 mm frame |
| String tension | 18–32 lb (integer) | pivot 26 lb. low ≤ 23, medium 24–28, high ≥ 29 |
| Grip | stock / thinOver / thickOver / tacky | stock replacement; thin overgrip; thick (cushioned) overgrip; tacky/sweat-focused |

`DEFAULT_CONFIG = { shape: "hybrid", weightClass: "medium", balance: "even", stringTensionLb: 26, grip: "stock" }`
— the neutral center of the model (all scores ≈ 50).

### 5.3 Output

```ts
type ScoreAxis = "power" | "control" | "maneuverability" | "forgiveness" | "comfort";
type ScoreVector = Record<ScoreAxis, number>; // each 0..100 (rounded integers for display)
```

> "Touch" from the product plan is presented in copy as the combination of high Control
> and adequate Comfort; it is **not** a separate stored axis (avoid axis sprawl).

---

## 6. Scoring Engine (the core)

Location: `src/lib/scoring/`. **Pure, synchronous, dependency-free, deterministic.**
No randomness, no I/O, no Date. Same input → same output. This is the unit-test anchor
and the artifact for the codex backend review.

### 6.1 Model form

Each axis starts at a baseline of **50**. Each configuration variable contributes an
additive delta per axis. Continuous tension contributes a linear delta around a pivot.
Deltas are summed and the result is clamped to `[0, 100]`, then rounded for display
(raw float retained internally for the recommender distance metric).

```
score[axis] = clamp(50
  + SHAPE_DELTA[shape][axis]
  + WEIGHT_DELTA[weightClass][axis]
  + BALANCE_DELTA[balance][axis]
  + GRIP_DELTA[grip][axis]
  + TENSION_COEFF[axis] * (stringTensionLb - TENSION_PIVOT),
  0, 100)
```

All coefficient tables live in `src/lib/scoring/model.ts` as typed constants with inline
rationale comments, so the model is tunable in one place (G5).

### 6.2 Coefficient tables (v1 starting values — tunable)

Baseline 50. `TENSION_PIVOT = 26`. Values are intentionally legible, not fitted.

**SHAPE_DELTA**

| shape | power | control | maneuver | forgive | comfort |
|---|---|---|---|---|---|
| teardrop | +18 | −12 | +4 | +14 | +2 |
| traditional | −10 | +18 | +6 | −12 | −2 |
| hybrid | +4 | +4 | +5 | +2 | 0 |

**WEIGHT_DELTA**

| weight | power | control | maneuver | forgive | comfort |
|---|---|---|---|---|---|
| light | −8 | −4 | +20 | −6 | +4 |
| medium | 0 | 0 | 0 | 0 | 0 |
| heavy | +16 | +8 | −20 | +8 | −6 |

**BALANCE_DELTA**

| balance | power | control | maneuver | forgive | comfort |
|---|---|---|---|---|---|
| headLight | −8 | +4 | +16 | −2 | +4 |
| even | 0 | 0 | 0 | 0 | 0 |
| headHeavy | +14 | −2 | −16 | +6 | −4 |

**GRIP_DELTA**

| grip | power | control | maneuver | forgive | comfort |
|---|---|---|---|---|---|
| stock | 0 | 0 | 0 | 0 | 0 |
| thinOver | 0 | +4 | +1 | 0 | +2 |
| thickOver | +2 | −4 | −1 | +3 | +6 |
| tacky | 0 | +5 | 0 | 0 | +3 |

**TENSION_COEFF** (per lb above the 26 lb pivot — lower tension trades control for power/comfort)

| axis | coeff/lb |
|---|---|
| power | −2.2 |
| control | +2.0 |
| maneuverability | 0 |
| forgiveness | −1.0 |
| comfort | −1.6 |

> Worked example: `DEFAULT_CONFIG` → all variable deltas 0 and tension term 0 → every
> axis = 50. A teardrop + light + headLight + 22 lb + thickOver build should read high
> Power/Maneuver/Forgiveness/Comfort and low-ish Control — verify in tests.

### 6.3 Explanation generator

`explain(prev: RacquetConfig, next: RacquetConfig): string[]` — produces 1–4
plain-language bullet strings describing the **largest** score changes between two
configs and attributing them to the variable(s) that changed. Deterministic, derived
from the same tables (no hard-coded prose per combination). Used by the simulator's
"what changed and why" panel. Also a static `describe(config)` for first load.

### 6.4 Recommender (inverse model — powers the quiz)

`recommend(target: EmphasisVector): { config, scores, distance }` (where `distance` is
the weighted error of the winning candidate — exposed for tests/debug), and
`EmphasisVector` is the player's relative valuation of each axis (0..1 weights summing to 1).

Algorithm: enumerate the candidate grid — `shape × weightClass × balance × grip ×
tensionSteps` (tension sampled every 2 lb across 18–32 = 8 steps → 3·3·3·4·8 = 864
candidates), score each with the engine, and pick the config minimizing a
weighted distance between its **normalized** score vector and the target emphasis
(emphasis-weighted squared error favoring the player's prioritized axes). Ties broken
toward beginner-friendliness (higher Forgiveness+Comfort) when the quiz marks the player
as a beginner. Deterministic; 864 evaluations is trivial (<1 ms), so brute force is
correct and simplest — **no premature optimization**, but structured so the grid/metric
are swappable. This is a prime candidate for the codex optimization pass.

---

## 7. Fit Quiz

Location: `src/components/quiz/`, logic in `src/lib/quiz/`.

### 7.1 Questions (5, one screen each, mobile-friendly, all single/limited choice)

1. **Level** — beginner / intermediate / advanced.
2. **Playing style** — control / power / all-round / defensive-retrieval.
3. **Swing speed & strength** — slow-light / moderate / fast-strong.
4. **Biggest pain point** — mishits / late swings / arm discomfort / lack of power / lack of precision.
5. **Preference** — learning-friendly vs. performance-focused (slider/toggle).

### 7.2 Answers → EmphasisVector

A pure `quizToEmphasis(answers): EmphasisVector` maps each answer to additive emphasis
contributions across the five axes, normalized at the end. Examples (illustrative, full
table in code):
- beginner / mishits / arm discomfort → boost Forgiveness, Comfort, Maneuverability.
- power style / fast-strong → boost Power, Control.
- learning-friendly preference → boost Forgiveness, Comfort; performance → Power, Control.

### 7.3 Result

Calls `recommend()`. Renders: the recommended **build spec plate** (the five chosen
variables), the **score vector** (radar + bars), and a beginner-friendly explanation
built from `describe()` plus quiz-aware framing. Primary CTA: **"Open in simulator"** →
`/build?c=<encoded(config)>`.

---

## 8. Configuration Simulator (the workbench)

Location: `src/components/simulator/`, state in `src/lib/state/` (Zustand).

### 8.1 Controls (left/bottom panel on mobile)
- Shape — 3-way segmented control.
- Weight class — 3-way segmented.
- Balance — 3-way segmented.
- String tension — slider 18–32 lb (integer, tick marks at low/med/high boundaries),
  with a numeric readout.
- Grip — 4-way segmented.

Each control change updates the Zustand store synchronously; scores, explanation, 3D, and
the `?c=` URL update reactively.

### 8.2 Readouts (right/top panel)
- Five axis readouts as labeled instrument bars (0–100) **and** a radar/pentagon plot —
  rendered with SVG (no chart lib; see §13). Values animate on change (count-up).
- "What changed and why" panel rendered from `explain(prev, next)`.
- Build summary "spec plate" with the encoded share link + **Copy link** + **Reset**.

### 8.3 State
Single Zustand store holding `RacquetConfig` + derived selectors (`scores`, `explanation`).
Derivations are memoized selectors calling the pure engine. The store is the only writer
of the `?c=` query param (debounced, shallow, no scroll). On mount, the store hydrates
from `?c=` if present, else `DEFAULT_CONFIG`.

---

## 9. 3D Blueprint Preview

Location: `src/components/preview3d/`. React Three Fiber + drei, lazy-loaded (dynamic
import, `ssr: false`) so it never blocks first paint or runs on the server.

Stylized **technical wireframe** racquet (matches the blueprint aesthetic — this is a
feature, not a limitation). Parametric from `RacquetConfig`:

| Config variable | Visible effect |
|---|---|
| shape | head outline: teardrop = open throat / elongated; traditional = closed throat with bridge; hybrid = blended outline |
| balance | a balance-point marker / weight-ring slides toward head or handle; subtle emphasis glow |
| grip thickness | handle radius scales (stock→thin→thick); grip color/material changes (tacky = distinct hue) |
| string tension | string-bed line density/brightness: higher tension = tighter, brighter lattice |

Constraints: stylized line-art with a faint reference grid and dimension ticks; runs at
60 fps on mobile; `<dpr>` capped; pauses rendering when offscreen/tab hidden (drei
`<PerformanceMonitor>` / `frameloop="demand"`). Graceful fallback: if WebGL is
unavailable, show a static SVG blueprint silhouette driven by the same params.

---

## 10. Shareable Builds (URL-encoded state)

Location: `src/lib/share/`.

- `encodeConfig(config): string` / `decodeConfig(str): RacquetConfig | null` — compact,
  URL-safe, **versioned** codec (leading version token so future model changes can
  migrate or reject old links gracefully). Round-trip and fuzz-tested.
- Invalid/garbage `?c=` decodes to `null` → fall back to `DEFAULT_CONFIG` (never throw,
  never blank-screen).
- The encoded string is short (enumerable variables + one integer), so a plain readable
  scheme (e.g. delimited tokens) is preferred over opaque base64 for debuggability.
- Copy-link uses the Clipboard API with a visible confirmation; full URL is shown as text
  as a fallback.

---

## 11. Visual Design Language — "Blueprint / Factory"

The differentiator. Every screen should read as a precision instrument. This section is
binding on the UI build; the `frontend-design` skill and the UI polish skills execute it.

### 11.1 Concept
Technical drawing meets factory configurator: drafting grid, dimension lines, callout
annotations, instrument readouts, monospace data, hairline rules, tick scales. Restrained,
confident, engineered — explicitly **not** generic SaaS/AI aesthetics.

### 11.2 Tokens (defined as CSS variables in `globals.css`, consumed via Tailwind v4 theme)
- **Surfaces** — deep graphite/ink base (`#0d1117`-ish range), layered panels with
  hairline borders; a faint blueprint grid overlay (low-opacity lines + tick marks).
- **Ink/text** — high-contrast off-white for data; muted slate for labels/annotations.
- **Accents** — one primary signal (blueprint cyan), one warning/emphasis (amber), used
  sparingly for active states, axis highlights, and dimension callouts. No multi-hue
  gradients.
- **Type** — monospace (Geist Mono, already installed) for readouts, labels, coordinates,
  spec plates; a precise grotesk/sans (Geist) for headings and body. Tabular numerals for
  all numeric readouts.
- **Geometry** — small radii or square corners; 8px base spacing grid; visible measured
  rules and tick scales; "spec plate" cards framed like a drawing title block.
- **Motion** — mechanical, precise easing; value count-ups; segmented controls snap with
  a tick; slider shows a measured track. No bouncy/elastic spring or decorative parallax.

### 11.3 Anti-slop checklist (enforced in review)
No purple→pink gradients, no emoji in UI chrome, no generic rounded glassmorphism cards,
no stock hero blur, no center-aligned marketing fluff, no lorem filler. Copy is terse and
technical. Iconography is line-based and consistent (lucide-react, already installed).

---

## 12. Accessibility

- Keyboard-operable: segmented controls (radio semantics), slider (`role="slider"` /
  native range with labels), quiz steps, copy button.
- Color is never the only signal — bars/radar carry text values; active states have shape
  or border changes, not just hue. Verify contrast ≥ WCAG AA for text and data.
- 3D canvas is decorative/secondary: has an accessible label and a non-canvas equivalent
  (the numeric readouts convey the same information); respects `prefers-reduced-motion`
  (disable count-ups, freeze 3D auto-rotation).
- Semantic landmarks, focus-visible styles consistent with the blueprint accent.

---

## 13. Performance Budgets

- First load (excluding 3D island): JS ≤ ~150 KB gzip; LCP-eligible content is HTML/CSS,
  not the canvas.
- 3D bundle (three / R3F / drei) is **lazy** and excluded from the critical path.
- No chart library — radar/bars are hand-rolled SVG (the engine output is five numbers).
- Scoring/recommender run client-side in <1 ms; no network round-trip for interaction.
- Images: none required beyond SVG; use `next/font` (already wired) — no layout shift.
- Target Lighthouse mobile ≥ 90 performance / ≥ 95 accessibility on `/` and `/build`.

---

## 14. Architecture & Code Layout

```
src/
  app/
    layout.tsx            # root shell, fonts, metadata, blueprint grid backdrop
    page.tsx              # console landing + simulator entry
    quiz/page.tsx         # quiz route (client island in server shell)
    build/page.tsx        # simulator workbench (reads ?c=)
    about/page.tsx        # transparency page
    globals.css           # design tokens (§11.2)
  lib/
    domain/               # RacquetConfig, enums, ranges, DEFAULT_CONFIG  (5)
    scoring/              # model.ts (tables), score.ts, explain.ts, recommend.ts (6)
    quiz/                 # questions, quizToEmphasis (7)
    share/                # encode/decode codec (10)
    state/                # zustand store + selectors (8)
  components/
    ui/                   # segmented control, slider, spec-plate, readout bar, radar
    simulator/            # workbench composition
    quiz/                 # quiz stepper + result
    preview3d/            # R3F scene (lazy)
docs/
  product-plan.md  spec.md  (and implementation plan to follow)
```

Separation of concerns: `lib/` is framework-agnostic and pure (engine, codec, quiz
mapping) — independently testable and the locus of the codex review. `components/` and
`app/` hold all React/Next/DOM/WebGL concerns. The store is the single bridge.

---

## 15. Testing Strategy

- **Engine unit tests** (highest priority): baseline → all-50; monotonicity (e.g., raising
  tension never raises Power; heavier never raises Maneuverability); clamping at extremes;
  every coefficient table row exercised; explanation picks the largest real deltas.
- **Recommender tests**: emphasis vectors that should yield characteristic builds
  (power-seeker → heavier/head-heavy/lower-ish tension; beginner → forgiving build);
  determinism; tie-break behavior.
- **Codec tests**: round-trip for a representative config matrix; malformed input → `null`;
  version token handling.
- **Quiz mapping tests**: representative answer sets → sane emphasis ordering.
- Test runner: lightweight (`vitest`) — added in the implementation plan. Pure `lib/`
  needs no DOM. A few smoke checks on store hydration from `?c=`.

---

## 16. Deployment

1. Keep `main` clean; commit in logical, conventional-commit increments throughout.
2. Create a **public** GitHub repo `racquet-build` (owner `samuelkahessay`); push `main`.
3. Deploy to **Vercel** (production) via the Vercel CLI; framework auto-detected (Next.js
   16). No env vars required for v1 (no backend/secrets).
4. Verify the production URL renders the console, simulator, quiz, 3D preview, and that a
   shared `?c=` link restores a build.
5. Preview deployments available for subsequent iteration.

---

## 17. Resolved Open Decisions (from product plan §"Open Product Decisions")

| Question | Resolution |
|---|---|
| Brand/name styling | **RacquetBuild** (one word), as already in code/metadata. |
| Real model data vs. generic | **Generic profiles only** for v1; brand/model DB deferred to phase 2. |
| 3D preview detail before launch | **Stylized wireframe blueprint** — intentional aesthetic, not a stopgap. |
| Saved builds: accounts vs. shareable state | **URL-encoded shareable state**, no accounts. |

---

## 18. Phase 2 (explicitly deferred, not built now)

User-submitted setups, reviews tagged by level/style, saved-build accounts, brand/model
database, coach notes. Each is independent and gets its own spec when prioritized.
