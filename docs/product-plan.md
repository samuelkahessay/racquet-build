# RacquetBuild Product Plan

## Working Positioning

RacquetBuild is a squash racquet fitting and configuration tool. It helps beginner and intermediate players understand what racquet attributes mean, choose a useful starting setup, and tune an existing racquet with clearer trade-offs.

## Primary Users

- Beginner and intermediate players buying their first serious squash racquet.
- Existing players who own a racquet and want to tune strings, grip, or balance.

## MVP Goal

Create a mobile-friendly web app where a player can either answer a short fit quiz or adjust a racquet configuration directly. The app should translate configuration choices into plain-language outputs such as more power, more control, easier maneuverability, more forgiveness, or better touch.

## Core MVP Surfaces

### 1. Fit Quiz

Questions should capture:

- Current level: beginner, intermediate, advanced.
- Playing style: control, power, all-round, defensive/retrieval.
- Swing speed and strength.
- Common pain points: mishits, late swings, arm discomfort, lack of power, lack of precision.
- Preference for learning-friendly versus performance-focused recommendations.

Output:

- Recommended racquet profile.
- Suggested weight/balance/shape/string-tension ranges.
- Explanation in beginner-friendly language.

### 2. Configuration Simulator

Player-controlled attributes:

- Shape: teardrop, traditional/closed throat, hybrid.
- Weight class: light, medium, heavy.
- Balance: head light, even, head heavy.
- String tension: low, medium, high, with pound ranges.
- Grip setup: stock grip, thin overgrip, thick overgrip, tacky/sweat-focused options.

Output:

- Power score.
- Control score.
- Maneuverability score.
- Forgiveness score.
- Comfort score.
- Short explanation of what changed and why.

### 3. 3D Preview

Use Three.js / React Three Fiber for a lightweight racquet visualization. The first version can be stylized rather than photorealistic, but it should reflect visible changes for:

- Shape silhouette.
- Balance emphasis.
- Grip thickness/color.
- String-bed tension indicator.

## Scoring Model

Start with a transparent heuristic model rather than pretending to have perfect expert truth. Each configuration variable contributes weighted effects to the output scores. Keep the model data-driven so it can be tuned later as community feedback or expert input improves.

Example direction:

- Lower string tension increases power and comfort but reduces precision.
- Higher string tension increases control but may reduce power and comfort.
- Head-heavy balance increases plow-through and power but reduces maneuverability.
- Head-light balance improves handling and reaction speed but may reduce easy power.
- Teardrop shapes can emphasize power and larger sweet spot.
- Traditional shapes can emphasize control and feel.

## Community Later

Community should be a second phase after the core simulator is useful.

Possible additions:

- User-submitted racquet setups.
- Racquet reviews tagged by level and play style.
- Saved builds and shareable build links.
- Brand/model database.
- Coach or advanced-player setup notes.

## Technical Plan

- Next.js App Router for the web app and Vercel deployment.
- TypeScript for configuration and scoring logic.
- Tailwind CSS for responsive UI.
- Zustand for client-side simulator state.
- Three.js, React Three Fiber, and drei for 3D preview.

## Deployment Plan

1. Keep local git history clean on `main`.
2. Create a GitHub remote named `racquet-build`.
3. Push `main`.
4. Import the repo into Vercel.
5. Use Vercel preview deployments for product iteration.

## Open Product Decisions

- Final brand/name styling: `RacquetBuild`, `Racquet Build`, or `RacquetBuild Community`.
- Whether the first public version should include real racquet model data or only generic profiles.
- How detailed the 3D preview should be before launch.
- Whether saved builds require accounts or can start as URL-encoded/shareable state.
