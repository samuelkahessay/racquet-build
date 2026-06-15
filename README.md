# RacquetBuild

RacquetBuild is a squash racquet fitting and configuration project. The first product direction is a mobile-friendly web app that helps beginner and intermediate players understand how racquet choices change feel, power, control, and maneuverability.

## Product Direction

- Fit quiz for players choosing their first serious squash racquet.
- Configuration simulator for players tuning a racquet they already own.
- 3D racquet preview powered by Three.js / React Three Fiber.
- Clear output language: power, control, forgiveness, maneuverability, touch, and player level fit.

## Configuration Model

Early variables to model:

- Racquet shape: teardrop, traditional/closed throat, hybrid.
- Static weight and balance: head light, even, head heavy.
- String tension: lower tension for power and comfort, higher tension for control.
- Grip setup: replacement grip, overgrip thickness, tackiness, sweat handling.
- Player intent: beginner-friendly, intermediate all-round, advanced control, advanced power.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Three.js with React Three Fiber and drei
- Zustand for client-side configuration state
- Vercel-ready deployment shape

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Next Steps

1. Write the product spec for the quiz, simulator, scoring model, and 3D preview.
2. Create the initial configuration data model.
3. Build the mobile-first simulator workflow.
4. Add the first lightweight 3D racquet scene.
5. Create the GitHub remote and connect Vercel deployment.
